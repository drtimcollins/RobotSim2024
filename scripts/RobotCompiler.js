import { CircleTree } from './CircleTree.js';

const logType = {OK:1, POSE:2, LAP:3, PRINT:4};
class RobotCompiler{
	constructor(){
        this.isInit = false;
    }    
	init(par){
        this.track = [];
        for(let n = 0; n < par.track.length; n += 2){
            this.track.push(this.toComplex(par.track[n].clone().lerp(par.track[n+1],0.5)));
        }
        this.ct = new CircleTree(this.track);

        let startIndex = 0;
        let startPoint = this.toComplex(par.start);
        let bestD2 = math.subtract(this.track[0], startPoint).abs();
		this.track.forEach(p => {
            let d2 = math.subtract(p, startPoint).abs();
            if(d2 < bestD2){
                startIndex = this.track.indexOf(p);
                bestD2 = d2;
            }
		});

		this.bot = par.robot;	
        this.start = par.start;
        this.startIndex = startIndex;
		this.isInit = true;
    }
    
    updateParams(params){
        this.bot = params;      
    }
    getSensorOutput(P){
        let p = this.ct.nearestPoint(P);

        let A = this.track[p.index];
        let B = this.track[(p.index + this.track.length - 1) % this.track.length];
        let cf1 = ((B.re-A.re) * (P.re-A.re) + (B.im-A.im) * (P.im-A.im)) / math.square(math.subtract(B,A).abs());
        let d1 = (P.clone().sub(A).sub(B.sub(A).mul(cf1))).abs();
        B = this.track[(p.index + 1) % this.track.length];
        let cf2 = ((B.re-A.re) * (P.re-A.re) + (B.im-A.im) * (P.im-A.im)) / math.square(math.subtract(B,A).abs());
        let d2 = (P.clone().sub(A).sub(B.sub(A).mul(cf2))).abs();
        let d = 0;
        if(cf1 >= 0 && cf1 <= 1 && cf2 >= 0 && cf2 <= 1)
            d = Math.min(d1, d2);
        else if(cf1 >= 0 && cf1 <= 1)
            d = d1;
        else if(cf2 >= 0 && cf2 <= 1)
            d = d2;
        else
            d = P.sub(A).abs();
        
        return Math.round(52760.0*Math.cos(1.5-Math.exp(0.4055-0.007*Math.pow(Math.abs(d),2.45))));
    }

    toComplex(p){ // Convert THREE.Vector2 to math.complex
        return new math.complex(p.x, p.y);
    }

    exe(fn, callback){
        console.log("Calling Python Compiler");
        
        console.log("NEW exe running");
        let width = this.bot.width;
        let rlength = this.bot.length;
        let NumberOfSensors = this.bot.NumberOfSensors;
        let SensorSpacing = this.bot.SensorSpacing;
        let WheelRadius = this.bot.WheelRadius;
        let XSTART = this.start.x - rlength;
        let YSTART = this.start.y;
        let ISTART = this.startIndex;

        let bearing = math.complex(1.0, 0);
        let R = math.complex(1.0, 0);
        let L = math.complex(1.0, 0);
        let speed = math.complex(0, 0);
        let av = math.complex(0, 0);
        let xy = math.complex(XSTART, YSTART);
        let vv, cFront;
        let sensorPos = Array(NumberOfSensors);
        let an = Array(NumberOfSensors);
        let N = this.track.length;
        let isLapValid = false;
        let isOverTheLine = true;
        this.frameRate = 50;

        timerfreq = null;
        for(let n = 0; n < NumberOfSensors; n++) {
            sensorPos[n] = math.complex(rlength, (n - (NumberOfSensors-1.0)/2.0)*SensorSpacing);
        }

        if(typeof window.myVals != "undefined") delete window.myVals;
        window.speed = [0,0];
        
        let cpc = runPyCode(fn);        

        if(cpc==0 && timerfreq == null){
            simPrintBuffer += "\nWarning: No timer is set-up (need a call to robot.timer)\n";  
        } else if(cpc==0 && timerfreq == -1){
            simPrintBuffer += "\nWarning: Timer frequency is not set.\n";
        } else if(cpc==0 && timercallback == null){ 
            simPrintBuffer += "\nWarning: Timer callback is not set.\n";
        }
        if(cpc != 0){
            simPrintBuffer += "\nError\n" + pyCodeError + "\n";
            timercallback = null;            
        }
 
        if(typeof window.myVals == "undefined"){
            window.myVals = {robot: {an: an}};
        }
        if(typeof myVals.robot == 'undefined'){
            myVals.robot = {an: an};
        }        
        this.updateSensors(an, sensorPos, bearing, xy);

        let timerMultiplier = 0;
        if(timerfreq != null) if(timerfreq > 0){
            console.log("Timer rate = " + timerfreq.toString());
            timerMultiplier = Math.ceil(50.0 / timerfreq);
            this.frameRate = timerfreq * timerMultiplier;
            console.log("Frame rate = " + this.frameRate.toString() + ", Multiplier = " + timerMultiplier.toString()); 
        } else {
            timerfreq = -1;
        }

        let output = [{log: logType.OK}];
        if(simPrintBuffer.length > 0){
            output.push({log: logType.PRINT, str: simPrintBuffer, time: 0});
            simPrintBuffer = "";
        }

        let iTrack = 0;  
        let fCoeff = Math.exp(-1/this.frameRate/0.24);

        for(let n = 0; n < this.frameRate * 60; n++){

            this.updateSensors(an, sensorPos, bearing, xy);

            if(timerfreq > 0){
                // Control algorithm 
                if(n % timerMultiplier == 0){               
                    try{          
                        if(timercallback != null){          
                            myVals[timercallback.$infos.__name__]();
                        }
                    }
                    catch(e){
                        console.log("Runtime error: " + e.args[0]);
                        simPrintBuffer += "Error\nLine "+e.$linenos[0]+": "+e.args[0];
                        timercallback = null;
                    }
                    if(simPrintBuffer.length > 0){
                        output.push({log: logType.PRINT, str: simPrintBuffer, time: n});
                        simPrintBuffer = "";
                    }
                }
            }

            let wsp = [(typeof window.speed[0] == "number") ? window.speed[0] : window.speed[0].value,
                        (typeof window.speed[1] == "number") ? window.speed[1] : window.speed[1].value];
            speed = math.multiply(math.complex(wsp[0], wsp[1]), 50.0 / this.frameRate);
            av = math.add(math.multiply(av,fCoeff), math.multiply(speed,1-fCoeff));
            vv = math.multiply(bearing, WheelRadius*(av.re + av.im)/2.0);            
            bearing = math.multiply(bearing, math.Complex.fromPolar(1, WheelRadius*(av.re-av.im)/width));
            cFront = math.add(xy, math.multiply(bearing, rlength));
            // Check for laps
            while(math.subtract(cFront, this.track[(iTrack+ISTART)%N]).abs() < 150.0){
                iTrack++;
                if(iTrack > N){
                    iTrack = 0;
                    isLapValid = true;
                }
            }

            if((!isOverTheLine) && (cFront.re >= XSTART+rlength)) isOverTheLine = true;
            if((isOverTheLine) && (cFront.re < XSTART+rlength)) isOverTheLine = false;
            if(isOverTheLine && cFront.im > YSTART-50 && isLapValid){
                output.push({log: logType.LAP, time: n});
                isLapValid = false;
            }

            xy = math.add(xy, vv);
            L = math.multiply(L, math.Complex.fromPolar(1, -av.re)); // wheel speed is av rad/frame = av rad/frame
            R = math.multiply(R, math.Complex.fromPolar(1, -av.im));            
            output.push({log: logType.POSE, xy: xy.clone(), bearing: bearing.clone(), L: L.clone(), R: R.clone(), an: [...an]});
        }    
        callback({Errors: null, Result: output, Stats: ""});        
    }
    updateSensors(an, sensorPos, bearing, xy){
        for(let m = 0; m < an.length; m++) {
            let sn = math.add(math.multiply(sensorPos[m], bearing) , xy); 
            myVals.robot.an[m] = an[m] = this.getSensorOutput(sn);
        } 
    }
}

export {RobotCompiler, logType};