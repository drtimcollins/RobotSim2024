// SmartCam - handles track and lighting
const TPrange = 200;
class SmartCam extends THREE.PerspectiveCamera{
    constructor(scene, robot){
        const initFov = 30;
        super(initFov, scene.width/scene.height, 1, 5000);
        //this.fov = initFov;        
        this.trackWidth = scene.width;
        this.trackHeight = scene.height;
        this.robot = robot;

        this.camTarget = new THREE.Mesh( new THREE.BoxGeometry(1,1,0.1));
        this.camTarget.position.set(this.trackWidth/2, this.trackHeight/2,1);
        scene.add(this.camTarget);    

        //this.testShape = new THREE.Mesh( new THREE.CubeGeometry(10,10,10));        
        //scene.add(this.testShape);

        this.aPan = new AutoPanner(7);
        this.TPcamPos = this.robot.shape.position.clone(); this.TPcamPos.x -= TPrange; this.TPcamPos.z -= 100;
        this.update();
        this.setCamPos(this.phi);
    }

    changeScene(scene){
        scene.add(this.camTarget);  
    }

    setCamPos(){
        const phi = this.phi;
        const zc   = this.trackHeight/2 * (1/Math.tan(this.fov*Math.PI/360.0) + Math.sin(phi*Math.PI/180));
        const zcam = -zc * Math.cos(phi*Math.PI/180);
        const ycam = zc * Math.sin(phi*Math.PI/180);

        const cPos1 = new THREE.Vector3(this.trackWidth/2, this.trackHeight/2, 1);
        const cPos2 = this.robot.shape.position.clone(); cPos2.z = 1;
        //const cPos3 = this.robot.shape.position.clone().add(new THREE.Vector3(500*this.robot.dv.x,500*this.robot.dv.y,1));
        //const cPos3 = this.robot.shape.position.clone().add(new THREE.Vector3(500*this.robot.pose.bearing.x,500*this.robot.pose.bearing.y,1));
        
        const cPos3Distance = 3.7*(this.robot.shape.robotLength - this.robot.shape.WheelRadius) + 20;
        const cPos3 = this.robot.shape.position.clone().add(new THREE.Vector3(cPos3Distance*Math.cos(this.robot.shape.rotation.z),cPos3Distance*Math.sin(this.robot.shape.rotation.z),1));
//        const cPos3 = this.robot.shape.position.clone().add(new THREE.Vector3(500*Math.cos(this.robot.shape.rotation.z),500*Math.sin(this.robot.shape.rotation.z),1));
        this.camTarget.position.copy(cPos1.multiplyScalar(this.aPan.a[0] + this.aPan.a[2] + this.aPan.a[6])).add(cPos2.multiplyScalar(this.aPan.a[1] + this.aPan.a[3] + this.aPan.a[4])).add(cPos3.multiplyScalar(this.aPan.a[5]));
                
        const pos1 = this.TPcamPos.clone();
        const pos2 = new THREE.Vector3(this.camTarget.position.x, this.camTarget.position.y + ycam*(1-0.5*this.follow), zcam*(1-0.5*this.follow)); 
        //const pos3 = this.robot.shape.position.clone().add(new THREE.Vector3(0,0,-60));
        const pos3 = this.robot.shape.position.clone().add(new THREE.Vector3(this.robot.shape.WheelRadius * Math.cos(this.robot.shape.rotation.z),this.robot.shape.WheelRadius * Math.sin(this.robot.shape.rotation.z),-this.robot.shape.WheelRadius-20));
        const pos4 = new THREE.Vector3(this.camTarget.position.x, this.camTarget.position.y + this.trackHeight/1.7, -this.trackHeight/2.5); 

        this.position.copy(pos1.multiplyScalar(this.aPan.a[4]).add(pos2.multiplyScalar(this.aPan.a[0]+this.aPan.a[1]+this.aPan.a[2]+this.aPan.a[3]).add(pos3.multiplyScalar(this.aPan.a[5]).add(pos4.multiplyScalar(this.aPan.a[6])))));
        this.up.set(0,-Math.cos(this.onBoard*Math.PI/2),-Math.sin(this.onBoard*Math.PI/2));
        this.lookAt( this.camTarget.position );
    }

    change(i){
        this.aPan.setTarget(i);
    }
    
    update(){
        this.aPan.update();
        this.onBoard = this.aPan.a[4]+this.aPan.a[5];
        this.phi = 50*(this.aPan.a[2]+this.aPan.a[3]) + 70*this.onBoard;
        this.follow = this.aPan.a[1] + this.aPan.a[3];
        if(this.fov != 30 + this.onBoard*20){
            this.fov = 30 + this.onBoard*20;
            this.updateProjectionMatrix();
        }
        this.driver = this.aPan.a[5];

        const rVec = this.TPcamPos.clone().sub(this.robot.shape.position);
        rVec.z = 0;
        rVec.normalize().multiplyScalar(TPrange).add(this.robot.shape.position);
        rVec.z = -150;
        this.TPcamPos.copy(rVec);
        //this.testShape.position.copy(this.TPcamPos);
                
        if(this.aPan.isTracking()) this.setCamPos();
    }
}

class AutoPanner {
    constructor(nDim){
        this.N = nDim;
        this.isMoving = false;
        this.a = new Array(this.N);
        this.aTarget = new Array(this.N);
        for(var n = 1; n < this.N; n++){
            this.a[n] = 0;
            this.aTarget[n] = 0;
        }
        this.a[0] = 1;
        this.aTarget[0] = 1;
        this.lastTarget = 0;
    }
    setTarget(newTargetIndex){
       for(var n = 0; n < this.N; n++){
           this.aTarget[n] = 0;
       }
        
        this.aTarget[newTargetIndex] = 1;
        this.lastTarget = newTargetIndex;
        this.isMoving = true;
    }
    isTracking(){
        return (this.isMoving || this.a[1] > 0 || this.a[3] > 0 || this.a[4] > 0 || this.a[5] > 0);
    }
    update(){
        if(this.isMoving){
            this.isMoving = false;
            for(var n = 0; n < this.N; n++){
                if(this.aTarget[n] != this.a[n]){
                    this.isMoving = true;
                    this.a[n] += Math.sign(this.aTarget[n] - this.a[n])*0.05;
                    if(this.a[n]>1) this.a[n]=1;
                    if(this.a[n]<0) this.a[n]=0;
                }
            }
        }
    }
}

export { SmartCam };         