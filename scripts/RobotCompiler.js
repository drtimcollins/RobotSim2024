//import { MAXSENSORS } from './RobotSimulator.js';
import { CircleTree } from './CircleTree.js';

const logType = {OK:1, POSE:2, LAP:3};
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
        
        return d < 10 ? 10000 : 0;
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
        let black_threshold = 100;

        let bearing = math.complex(1.0, 0);
        let R = math.complex(1.0, 0);
        let L = math.complex(1.0, 0);
        let speed = math.complex(0, 0);
        let av = math.complex(0, 0);
        let xy = math.complex(XSTART, YSTART);
        let vv, cFront;
        //let j = math.complex(0, 1);
        let sensorPos = Array(NumberOfSensors);
        let an = Array(NumberOfSensors);
        let N = this.track.length;
        let isLapValid = false;

        let cpc = runPyCode(fn);
        if(cpc == 0){

            let output = [{log: logType.OK}];
            for(let n = 0; n < NumberOfSensors; n++) {
                sensorPos[n] = math.complex(rlength, (n - (NumberOfSensors-1.0)/2.0)*SensorSpacing);
            }
            let iTrack = 0;
            for(let n = 0; n < 3000; n++){
                // Update sensors
                for(let m = 0; m < NumberOfSensors; m++) {
                    let sn = math.add(math.multiply(sensorPos[m], bearing) , xy); 
                    myVals.robot.an[m] = an[m] = this.getSensorOutput(sn);
                } 
                // Process

                // Control algorithm
                try{                    
                    myVals[timercallback.$infos.__name__]();
                }
                catch(e){
                    console.log("Runtime error: " + e.args[0]);
                    callback({Errors: "Line "+e.$linenos[0]+": "+e.args[0], Result: null, Stats: ""}); 
                    return; 
                }
                speed = math.complex(myVals.robot.speed[0].value, myVals.robot.speed[1].value);

                av = math.add(math.multiply(av,0.92), math.multiply(speed,0.08));
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
                if(cFront.re < XSTART+rlength && math.add(cFront, vv).re >= XSTART+rlength && cFront.im > YSTART-50 && isLapValid){
                    output.push({log: logType.LAP, time: n});
                    isLapValid = false;
                }

                xy = math.add(xy, vv);
                L = math.multiply(L, math.Complex.fromPolar(1, -av.re)); // wheel speed is av rad/frame = 50av rad/s
                R = math.multiply(R, math.Complex.fromPolar(1, -av.im));            
                output.push({log: logType.POSE, xy: xy.clone(), bearing: bearing.clone(), L: L.clone(), R: R.clone(), an: [...an]});
            }        
            callback({Errors: null, Result: output, Stats: ""});        
        } else {
            callback({Errors: pyCodeError, Result: null, Stats: ""});        
        }
    }

    exe_oldcpp(fn, callback){
        var cpp = this;
         $.get("scripts/RobotSrc.cpp", function (data){
            data = data.replace("#define DEFINES",
                "#define width " + cpp.bot.width.toString() 
                + "\n#define rlength " + cpp.bot.length.toString()
                + "\n#define NumberOfSensors " + cpp.bot.NumberOfSensors.toString()
                + "\n#define SensorSpacing " + cpp.bot.SensorSpacing.toString()
                + "\n#define WheelRadius " + cpp.bot.WheelRadius.toString()
                + "\n#define XSTART " + (cpp.start.x-cpp.bot.length).toString()
                + "\n#define YSTART " + (cpp.start.y).toString()
                + "\n#define ISTART " + (cpp.startIndex).toString());
            console.log("#define XSTART " + (cpp.start.x-cpp.bot.length).toString()
            + "\n#define YSTART " + (cpp.start.y).toString()
            + "\n#define ISTART " + (cpp.startIndex).toString());
            data = data.replace("#define ROBOTCONTROLFUNCTION", fn);
 
            let to_compile = JSON.stringify({"cmd": "g++ -std=c++20 -O2 -pthread main.cpp && ./a.out << EOF\n"+cpp.inString+"\nEOF",
                                             "src": data });
            var http = new XMLHttpRequest();
            http.open("POST", "https://coliru.stacked-crooked.com/compile", false);
            http.onload = function(onLoadarg){              
                tempDownloadCode(http.response, "resultDownload.txt");
                let dataJ = http.response.split('\n');
                let dataString = "";
                let errString = "";
                let infString = "";
                if(dataJ[0] == "###OK###"){
                    dataJ.forEach(x => {
                        if(x != "###OK###")
                            dataString += decodeHex(x, cpp.bot.NumberOfSensors);
                    });
                } else {
                    errString = http.response;
                }
                callback({Errors: (errString.length > 0)?errString:null, Result: dataString, Stats: infString});
            };
            tempDownloadCode(to_compile, "codeDownload.json");
            http.send(to_compile);
        });
    }
}

function tempDownloadCode(code, fname){
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code));
    element.setAttribute('download', fname);
    
    element.style.display = 'none';
    document.body.appendChild(element);    
    element.click();
    document.body.removeChild(element);
}

/*function decodeHex(x, nSensors){
    let z = "";
    let xx = x.split(/\r?\n/);
    xx.forEach(xn=>{
        if(xn.length > 0) z += deHex(xn, nSensors);
    });
    return z;
}
function deHex(x, nSensors){
    if(x.substring(0,1) == 'L') return x+"\n";
    else
    return (hex2int(x.substring(0,4))/16+640).toString() + " " +
            (hex2int(x.substring(4,8))/16+360).toString() + " " +
            (Math.cos(hex2int(x.substring(8,12))/10000)).toString() + " " +
            (Math.sin(hex2int(x.substring(8,12))/10000)).toString() + " " +
            (Math.cos(hex2int(x.substring(12,16))/10000)).toString() + " " +
            (Math.sin(hex2int(x.substring(12,16))/10000)).toString() + " " +
            (Math.cos(hex2int(x.substring(16,20))/10000)).toString() + " " +
            (Math.sin(hex2int(x.substring(16,20))/10000)).toString() + " " +
            senseDec(x.substring(20,23), nSensors) + "\n";
}
function hex2int(s){
    let x = parseInt(s, 16);
    return (x>32767) ? x - 65536 : x;
}
function senseDec(s, nSensors){
    let x = ("0000000000" + parseInt(s, 16).toString(2)).slice (-10);
    let z = x.substring(nSensors-1,nSensors);
    for(let n = 1; n < nSensors; n++) z += " " + x.substring(nSensors-n-1,nSensors-n)
    return z;
}
*/
export {RobotCompiler, logType};