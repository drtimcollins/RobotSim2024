//import { MAXSENSORS } from './RobotSimulator.js';
const logType = {OK:1, POSE:2, LAP:3};
class RobotCompiler{
	constructor(){
        this.isInit = false;
    }    
	init(par){
		// Find track Bounds
        let minmax = [par.bbox.min.x, par.bbox.min.y, par.bbox.max.x, par.bbox.max.y];
        let startIndex = 0;
        let bestD2 = par.track[0].distanceToSquared(par.start);
		par.track.forEach(p => {
            let d2 = p.distanceToSquared(par.start);
            if(d2 < bestD2){
                startIndex = par.track.indexOf(p);
                bestD2 = d2;
            }
		});
		this.track = par.track;
		this.trackBounds = [new THREE.Vector2(minmax[0],minmax[1]), new THREE.Vector2(minmax[2],minmax[3])];
		console.log(this.trackBounds);
		this.bot = par.robot;	
        this.start = par.start;
        this.startIndex = startIndex;

        // Input format:
        // minmax0 mm1 mm2 mm3 NtrackPoints trackpoint_n_x trackpoint_n_y etc
        this.inString = minmax[0].toFixed(1) + " " + minmax[1].toFixed(1) + " " + minmax[2].toFixed(1) + " " + minmax[3].toFixed(1) + " " + par.track.length.toString();
        par.track.forEach(p =>{
            this.inString = this.inString + " " + p.x.toFixed(1) + " " + p.y.toFixed(1);
        })
		this.isInit = true;
    }
    
    updateParams(params){
        this.bot = params;      
    }
    getSensorOutput(z){
        return 0;
    }

    toComplex(p){ // Convert THREE.Vector2 to math.complex
        return new math.complex(p.x, p.y);
    }

    exe(fn, callback){
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
        let speed = math.complex(0.05, 0.1); // TESTING (should be 0,0)
        let av = math.complex(0, 0);
        let xy = math.complex(XSTART, YSTART);
        let vv, cFront;
        //let j = math.complex(0, 1);
        let sensorPos = Array(NumberOfSensors);
        let an = Array(NumberOfSensors);
        let N = this.track.length;
        let isLapValid = false;

        let output = [{log: logType.OK}];
        for(let n = 0; n < NumberOfSensors; n++) {
            sensorPos[n] = math.complex(rlength, (n - (NumberOfSensors-1.0)/2.0)*SensorSpacing);
        }
        let iTrack = 0;
        for(let n = 0; n < 3000; n++){
            // Update sensors
            for(let m = 0; m < NumberOfSensors; m++) {
                let sn = math.add(math.multiply(sensorPos[m], bearing) , xy); 
                an[m] = this.getSensorOutput(sn);
            } 
            // Process
            // TODO: Control algorithm
            //
            av = math.add(math.multiply(av,0.92), math.multiply(speed,0.08));
            vv = math.multiply(bearing, WheelRadius*(av.re + av.im)/2.0);            
            bearing = math.multiply(bearing, math.Complex.fromPolar(1, WheelRadius*(av.re-av.im)/width));
            cFront = math.add(xy, math.multiply(bearing, rlength));
            // Check for laps
            while(math.subtract(cFront, this.toComplex(this.track[(iTrack+ISTART)%N])).abs() < 150.0){
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

function decodeHex(x, nSensors){
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

export {RobotCompiler, logType};