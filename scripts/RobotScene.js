// RobotScene - handles track and lighting
class RobotScene extends THREE.Scene{
    constructor(params, onTrackLoaded){
        super();
//        this.bgList = [new THREE.Color(0x000000), new THREE.Color(0xE0F0FF)];
//        this.background = this.bgList[0];
        this.lights = [];
        this.width = params.width;
        this.height = params.height;
        this.isLoaded = false;


        this.background = new THREE.Color(0x000000);
        this.room = [];
        const texCarpet = new THREE.TextureLoader().load('img/textures/carpet.jpg');        
        texCarpet.wrapS = THREE.RepeatWrapping;
        texCarpet.wrapT = THREE.RepeatWrapping;
        texCarpet.repeat.set( 10, 10 );
        this.room.push(new THREE.Mesh( new THREE.PlaneGeometry( 6000, 6000 ), 
            new THREE.MeshBasicMaterial( {map: texCarpet} ) ));
        this.room[0].rotateX(-Math.PI);
        this.room[0].position.set(params.width/2,params.height/2,800);

        const wallShape = new THREE.Shape().moveTo(-1250,-3000).lineTo(-1250,3000).lineTo(1250,3000).lineTo(1250,-3000).lineTo(-1250,-3000);
        const window1 = new THREE.Path().moveTo(-350,-2750).lineTo(-350,-150).lineTo(950,-150).lineTo(950,-2750).lineTo(-350,-2750);
        const window2 = new THREE.Path().moveTo(-350,2750).lineTo(-350,150).lineTo(950,150).lineTo(950,2750).lineTo(-350,2750);
        wallShape.holes = [window1, window2];
        const texBlind = new THREE.TextureLoader().load('img/textures/blind.png');        
        texBlind.wrapS = THREE.RepeatWrapping;
        texBlind.wrapT = THREE.RepeatWrapping;
        texBlind.repeat.set( 20, 5 );
        const texDoor = new THREE.TextureLoader().load('img/textures/door.png');        
        const texSocket = new THREE.TextureLoader().load('img/textures/socket.png');  
        const texWoodSide = new THREE.TextureLoader().load('img/textures/woodSide.jpg');
        texWoodSide.wrapS = THREE.RepeatWrapping;
        texWoodSide.repeat.set( 8, 1 );
        const texWoodLeg = new THREE.TextureLoader().load('img/textures/woodLeg.jpg');
        texWoodLeg.wrapT = THREE.RepeatWrapping;
        texWoodLeg.repeat.set( 1, 3 );
        const skirtingShape = new THREE.Shape().moveTo(2710,2985).lineTo(2985,2985).lineTo(2985,-2985).lineTo(-2985,-2985).lineTo(-2985,2985).lineTo(1740,2985)
            .lineTo(1740,3100).lineTo(-3100,3100).lineTo(-3100,-3100).lineTo(3100,-3100).lineTo(3100,3100).lineTo(2710,3100).lineTo(2710,2985);

        this.room.push(new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape,{depth:200, bevelEnabled: false}), 
            new THREE.MeshLambertMaterial( {color: 0xfffff0} ) ));
        this.room[1].rotateX(-Math.PI/2);
        this.room[1].rotateZ(Math.PI/2);
        this.room[1].position.set(params.width/2,params.height/2-3200,800-1250);
        this.room.push(new THREE.Mesh( new THREE.PlaneGeometry( 6000, 2500 ), 
            new THREE.MeshLambertMaterial( {color: 0xfffff0} ) ));
        this.room[2].rotateX(Math.PI/2);
        this.room[2].position.set(params.width/2,params.height/2+3000,800-1250);
        this.room.push(new THREE.Mesh( new THREE.PlaneGeometry( 2500, 6000 ), 
            new THREE.MeshLambertMaterial( {color: 0xfafaeb} ) ));
        this.room[3].rotateY(-Math.PI/2);
        this.room[3].position.set(params.width/2+3000,params.height/2,800-1250);
        this.room.push(new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape,{depth:200, bevelEnabled: false}), 
            new THREE.MeshLambertMaterial( {color: 0xfffaeb} ) ));
        this.room[4].rotateY(Math.PI/2);
        this.room[4].position.set(params.width/2-3200,params.height/2,800-1250);

        this.room.push(new THREE.Mesh( new THREE.PlaneGeometry( 6000, 1400 ), 
            new THREE.MeshLambertMaterial( {map: texBlind} ) ));
        this.room[5].rotateY(Math.PI/2);
        this.room[5].rotateZ(-Math.PI/2);
        this.room[5].position.set(params.width/2-3200,params.height/2,800-1250-350);
        this.room.push(new THREE.Mesh( new THREE.PlaneGeometry( 6000, 1400 ), 
            new THREE.MeshLambertMaterial( {map: texBlind} ) ));
        this.room[6].rotateX(-Math.PI/2);
        this.room[6].position.set(params.width/2,params.height/2-3200,800-1250-350);

        this.room.push(new THREE.Mesh(new THREE.PlaneGeometry(970, 2060), //850,2000),
            new THREE.MeshLambertMaterial( {map: texDoor} )));
        this.room[7].rotateX(Math.PI/2);
        this.room[7].rotateZ(Math.PI);
        this.room[7].position.set(params.width/2+2225,params.height/2+2998,-230);
        this.room.push(new THREE.Mesh(new THREE.ExtrudeGeometry(skirtingShape,{depth:100, bevelEnabled: false}), 
            new THREE.MeshLambertMaterial( {color: 0x404040} ) ));
        this.room[8].position.set(params.width/2, params.height/2, 700);
        this.room.push(new THREE.Mesh(new THREE.PlaneGeometry(146,86),
            new THREE.MeshLambertMaterial( {map: texSocket} )));
        this.room[9].rotateX(Math.PI/2);
        this.room[9].rotateZ(Math.PI);
        for(let n = 0; n < 3; n++)
            this.room.push(this.room[9].clone());
        this.room[9].position.set(params.width/2-2225,params.height/2+2995,300);
        this.room[10].position.set(params.width/2+1300,params.height/2+2995,300);
        this.room[11].rotateY(Math.PI/2);
        this.room[11].position.set(params.width/2+2995,params.height/2+2225,300);
        this.room[12].rotateY(Math.PI/2);
        this.room[12].position.set(params.width/2+2995,params.height/2-2225,300);
        this.room.push(new THREE.Mesh(new THREE.BoxGeometry(2700,230,40), 
            new THREE.MeshLambertMaterial( {color: 0xf0f0f0} ) ));
        this.room.push(this.room[13].clone());
        this.room[13].position.set(params.width/2+1450, params.height/2-3085, -100);
        this.room[14].position.set(params.width/2-1450, params.height/2-3085, -100);
        this.room.push(new THREE.Mesh(new THREE.BoxGeometry(230,2700,40), 
            new THREE.MeshLambertMaterial( {color: 0xf0f0f0} ) ));
        this.room.push(this.room[15].clone());
        this.room[15].position.set(params.width/2-3085, params.height/2+1450, -100);
        this.room[16].position.set(params.width/2-3085, params.height/2-1450, -100);

        this.room.forEach(x => this.add(x));

        for(let n = 0; n < 4; n++){
            var light = new THREE.PointLight( 0xa0a0a0, 0.1);
    
            light.position.set( (n%2)*params.width, Math.floor(n/2)*params.height, -1200);
            light.castShadow = true;        
            light.shadow.mapSize = new THREE.Vector2(1024,1024);
            light.shadow.darkness = 0x606060;
            var dd = 1500;
            light.shadow.camera.far = 5000;
            light.shadow.camera.left = -dd;
            light.shadow.camera.right = dd;
            light.shadow.camera.top = dd;
            light.shadow.camera.bottom = -dd;
            light.shadow.camera.near = 100;
            light.shadow.radius = 3;
            this.add( light );
            this.lights.push(light);
        }
        this.add( new THREE.AmbientLight(0xc0c0c0));

        this.trackMesh = new THREE.Group();
        // White Base
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            0,0,0.5,0,params.height,0.5,
            params.width,params.height,0.5,params.width,0,0.5
            ]), 3));
        g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0,0,-1,0,0,-1,0,0,-1,0,0,-1]), 3));
        g.setIndex([0,2,3,2,0,1]);
        //g.computeFaceNormals();    
        var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var baseMesh = new THREE.Mesh(g, material);
        baseMesh.receiveShadow = true;
        baseMesh.castShadow = true;
        this.trackMesh.add(baseMesh);

        this.trackMesh.add(this.makeStartFinish(params.sf));

        this.turntableMat = [new THREE.MeshPhongMaterial({color:0x205020, shininess:5, specular: 0xFFFFFF }),
            new THREE.MeshPhongMaterial({color:0xFF0000, shininess:5, specular: 0xFFFFFF })];
        this.turntable = new THREE.Mesh(new THREE.CylinderGeometry( 130, 130, 30, 64 ), 
                        new THREE.MeshPhongMaterial({color:0xD0D0B0, shininess:5, specular: 0xFFFFFF }));
        this.turntableTop = new THREE.Mesh(new THREE.CylinderGeometry( 100, 100, 2, 64 ), this.turntableMat[0]);
        this.turntable.rotateX(Math.PI/2);
        this.turntableTop.rotateX(Math.PI/2);
        this.turntable.position.set(params.width/2, params.height/2,17);    // Top is 2mm below zero
        this.turntableTop.position.set(params.width/2, params.height/2,1);    // Top is 2mm below zero
        this.turntable.receiveShadow = true;
        this.turntableTop.receiveShadow = true;
        this.add(this.turntable);
        this.add(this.turntableTop);
        
        this.gridHelper = new THREE.GridHelper(1200, 12, 0x00FF00, 0x409040);
        this.gridHelper.rotateX(Math.PI/2);
        this.gridHelper.position.set(params.width/2, params.height/2,32);
//        this.gridHelper.position.set(params.width/2, params.height/2,-.5);
        this.add( this.gridHelper );

        this.trackBase = new THREE.Mesh(new THREE.BoxGeometry(params.width, params.height, 60), 
            new THREE.MeshLambertMaterial( {map: texWoodSide} ) );
        this.trackBase.position.set(params.width/2, params.height/2, 32);
        this.add(this.trackBase);
        this.legs = [];
        const legMesh = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 790), 
            new THREE.MeshLambertMaterial( {map: texWoodLeg} ) );
        for(let n = 0; n < 4; n++){
            this.legs.push(legMesh.clone());
            this.legs[n].position.set( (n%2)*(params.width-100)+50, Math.floor(n/2)*(params.height-100)+50, 420);
            this.add(this.legs[n]);
        }

        // Track
        var loader = new THREE.PLYLoader();
        loader.load('img/'+params.name+'.ply', function(geometry) {
            geometry.computeVertexNormals();  
                //geometry.computeFaceNormals();
            var trackMat = new THREE.MeshLambertMaterial({color: 0x000000});
            this.trackLine = new THREE.Mesh(geometry, trackMat);
            this.trackLine.receiveShadow = true;
            //this.trackLine.castShadow = true;
            this.trackMesh.add(this.trackLine);
            this.add(this.trackMesh);
            this.isLoaded = true;
            onTrackLoaded();
        }.bind(this) , function() {});  
    }    

    makeStartFinish(sf){
        this.startFinish = new THREE.Group();
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array( [-8,  32, 0, 8, 32, 0, 8,  -32, 0, -8,  -32, 0, -8,  32, 0]);        
        geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        const line = new THREE.Line( geometry, new THREE.MeshLambertMaterial( { color: 0x000000 } ) );
        this.startFinish.add(line);
        const g = new THREE.BufferGeometry();
        const vertices2 = new Float32Array([0,0,0,0,8,0,8,8,0,8,0,0]);        
        g.setAttribute('position', new THREE.BufferAttribute(vertices2, 3));
        g.setIndex([0,2,3,2,0,1]);
        g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0,0,-1,0,0,-1,0,0,-1,0,0,-1]), 3));
        //g.computeFaceNormals();    
        const bSquare = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x000000 }));
        bSquare.receiveShadow = true;
        const wSquare = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
        wSquare.receiveShadow = true;

        var s;
        for(var n = 0; n < 8; n++){
            s = bSquare.clone();
            s.position.set(0-8*(n%2),n*8-32,-0.1);
            this.startFinish.add(s.clone());
            s = wSquare.clone();
            s.position.set(-8+(n%2)*8,n*8-32,-0.1);
            this.startFinish.add(s.clone());
        }
        this.startFinish.position.set(sf.x,sf.y,-.15);
        return(this.startFinish);
    }
}

export { RobotScene }; 