//import { MAXSENSORS } from './RobotSimulator.js';

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

    exe(fn, callback){
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
            http.send(to_compile);
        });
    }
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

export {RobotCompiler};