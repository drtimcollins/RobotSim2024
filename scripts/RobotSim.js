import { RobotShape } from './RobotShape.js';
const black_threshold = 1000;

class RobotSim {
    constructor(scene, params){
        this.width = params.width;
        this.length = params.length;
        this.NumberOfSensors = params.NumberOfSensors;
        this.SensorSpacing = params.SensorSpacing;
        this.WheelRadius = params.WheelRadius;
        this.shape = new RobotShape(this.width, this.length, this.NumberOfSensors,  this.SensorSpacing, this.WheelRadius);     
        this.shape.position.set(scene.width/2 - this.shape.xOffset, scene.height/2, 0);

        this.scene = scene;        
        this.scene.add(this.shape);
	}

    changeScene(scene){
        this.scene = scene;        
        this.scene.add(this.shape);
    }

    play(rec, frame){
        const n = (frame < 0) ? 0 : Math.max(0,Math.floor(frame));  // Integer part
        const f1 = (frame < 0) ? 0 : frame - n;                     // Fractional part
        const f0 = 1 - f1;                                          // 1 - Fractional part
        
        if(n+1 <= rec.length-1){   
/*            if(n < 20){
                console.log([rec[n].pose.R.toPolar(), rec[n+1].pose.R.toPolar()]);
                console.log([rec[n].pose.L.toPolar(), rec[n+1].pose.L.toPolar()]);
            }*/
            //this.shape.Rw.rotation.z = math.add(math.multiply(f0,rec[n].pose.R),math.multiply(f1,rec[n+1].pose.R)).toPolar().phi;
            //this.shape.Lw.rotation.z = math.add(math.multiply(f0,rec[n].pose.L),math.multiply(f0,rec[n+1].pose.L)).toPolar().phi;
            
            this.shape.Rw.rotation.z = this.interpWheel(rec[n].pose.R, rec[n+1].pose.R, f0, f1);
            this.shape.Lw.rotation.z = this.interpWheel(rec[n].pose.L, rec[n+1].pose.L, f0, f1);

            let xy = math.add(math.multiply(f0, rec[n].pose.xy),math.multiply(f1, rec[n+1].pose.xy));
            this.shape.position.set(xy.re, xy.im, 0); 
            this.shape.rotation.z = math.add(math.multiply(f0,rec[n].pose.bearing), math.multiply(f1,rec[n+1].pose.bearing)).toPolar().phi;   
            for(var m = 0; m < this.shape.NumberOfSensors; m++) {
                this.shape.sensors[m].material = (rec[n].pose.an[m] <= black_threshold) ? this.shape.sensorLEDMat : this.shape.sensorLEDMatOn; 
            }            
        }
    }

    interpWheel(z0, z1, f0, f1){
        let p0 = z0.toPolar().phi;
        let p1 = z1.toPolar().phi;
        return (p1 <= p0) ? (f0*p0 + f1*p1) : (f0*p0 + f1*(p1-2*Math.PI));
    }

    designShow(frame){
        let angle = 2.0*Math.PI*frame/500.0;
        this.shape.rotation.z = angle;
        this.shape.position.set(this.scene.width/2 - this.shape.xOffset*Math.cos(angle), this.scene.height/2 - this.shape.xOffset*Math.sin(angle), 0);
        //this.scene.turntableTop.geometry.scale(this.shape.radius/100,1,this.shape.radius/100);
        this.scene.turntableTop.scale.x = this.shape.radius/100;
        this.scene.turntableTop.scale.z = this.shape.radius/100;
//        this.scene.turntableTop.material = this.scene.turntableMat[this.shape.radius > 130 ? 1 : 0];
        this.scene.turntableTop.material = this.scene.turntableMat[this.shape.sizeOK ? 0 : 1];
    }

    isLoaded(){
        return this.shape.isLoaded;
    }
}

export { RobotSim }; 