const guiAR = 6.0;
const skewFactor = 10.0;
const onCol = '#001020';
const offCol = '#E0E0FF';
const segDec = [[1,1,1,1,1,1,0],[0,1,1,0,0,0,0],[1,1,0,1,1,0,1],[1,1,1,1,0,0,1],[0,1,1,0,0,1,1],[1,0,1,1,0,1,1]
                ,[1,0,1,1,1,1,1],[1,1,1,0,0,0,0],[1,1,1,1,1,1,1],[1,1,1,1,0,1,1]];
const iconTitles=['Top view','Side view','Robot view','Zoom out','Zoom in','Slow motion'];                
class RobotGui{
    constructor(callback){
        this.two = new Two({width:500,height:500/guiAR}).appendTo(document.getElementById('guiWin'));  
        this.camMode = 0;
        this.camZoom = 0;
        this.isSloMo = false;
        this.b = new Array(6);
        for(let i = 0; i < 6; i++){
            this.b[i] = new Icon(280+i*30,20,25,i,this.two);            
        }
        this.bDes = new Icon(487,20,25,6,this.two);
        this.refillIcons();
        this.two.add(new Two.Text("This lap", 60, 40, {size:10}));
        this.two.add(new Two.Text("Last lap", 180, 40, {size:10}));
        this.two.add(new Two.Text("Camera options", 360, 40, {size:10}));
        this.timers = [new Digits(60,20,8, this.two), new Digits(180,20,8, this.two)];
        this.two.update();
        for(var i = 0; i < 6; i++){
            this.b[i]._renderer.elem.addEventListener('click', function(){callback(this.id);}, false);
            this.b[i]._renderer.elem.iconTitle = iconTitles[i];
            this.b[i]._renderer.elem.addEventListener('mouseover', function(ev){$('#guiWin').prop('title', ev.currentTarget.iconTitle);}, false);
            this.b[i]._renderer.elem.addEventListener('mouseleave', function(){$('#guiWin').prop('title', '')}, false);
        }
        this.bDes._renderer.elem.addEventListener('click', function(){callback(this.id);}, false);
        this.bDes._renderer.elem.addEventListener('mouseover', function(){$('#guiWin').prop('title', "Robot setup");}, false);
        this.bDes._renderer.elem.addEventListener('mouseleave', function(){$('#guiWin').prop('title', '')}, false);
        this.two.play();       
    }

    refillIcons(){
        this.b.forEach(x => x.bg.fill = '#FAFAFF');     
        if(this.isSloMo) this.b[5].bg.fill = '#FFFFAA';
        this.b[this.camMode].bg.fill = '#FFFFAA';
        this.b[this.camZoom + 3].bg.fill = '#FFFFAA';
    }
    
    resize(newWidth){
        if(this.two != null){
            this.two.height = newWidth/guiAR;
            this.two.width = newWidth;
            this.two.scene.scale = newWidth/500;
            this.two.update();
        }    
    }
}
class Icon extends Two.Group{
    constructor(x, y, h, i, two){
        super();       
        this.bg = two.makeRoundedRectangle(0, 0, h, h, h/5);
        this.add(this.bg);
        switch(i){
            case 0: // Top view
                this.add(two.makeRectangle(-0.25*h,0.3*h,0.2*h,0.02*h));
                this.add(two.makeRectangle(-0.25*h,-0.3*h,0.2*h,0.02*h));
                this.add(two.makePath(-0.35*h,0.25*h,-0.15*h,0.25*h,0.33*h,0,-0.15*h,-0.25*h,-0.35*h,-0.25*h,false));
                this.add(two.makeRectangle(0.33*h,0,0.06*h,0.25*h));
                break;
            case 1: // Side view
                this.add(two.makePath(-0.35*h,0,-0.35*h,-0.2*h,-0.15*h,-0.2*h,0.33*h,0,false));
                this.add(two.makeCircle(-0.25*h,0,0.1*h));
                break;
            case 2: // Back view
                this.add(two.makeRectangle(-0.3*h,0,0.02*h,0.2*h));
                this.add(two.makeRectangle(0.3*h,0,0.02*h,0.2*h));
                this.add(two.makeRectangle(0,-0.07*h,0.5*h,0.2*h));
                break;
            case 3: // Zoom out
            case 4: // Zoom in
                let m = [two.makeLine(-0.1*h,-0.1*h,0.3*h,0.3*h), two.makeCircle(-0.1*h,-0.1*h,0.25*h),
                    two.makeLine(-0.25*h,-0.1*h,0.05*h,-0.1*h), two.makeLine(-0.1*h,-0.25*h,-0.1*h,0.05*h)];
                for(let n = 0; n < i; n++){
                    m[n].linewidth = h*.1;
                    this.add(m[n]);
                }
                break;
            case 5: // Slo-mo
                let tortoise = new Two.Path([new Two.Anchor(0.2643*h, -0.0549*h, 0, 0, 0, 0, 'M'),
                        new Two.Anchor(0.1336*h, 0.0907*h, 0.0425*h, -0.036*h, -0.0252*h, 0.0194*h, 'C'),
                        new Two.Anchor(0.1168*h, 0.2414*h, 0.0154*h, -0.0165*h, -0.0182*h, 0.0169*h, 'C'),
                        new Two.Anchor(0.0086*h, 0.2423*h, 0.0143*h, 0.0089*h, -0.0212*h, -0.0143*h, 'C'),
                        new Two.Anchor(-0.0005*h, 0.114*h, 0, 0, 0, 0, 'C'),
                        new Two.Anchor(-0.1581*h, 0.1125*h, 0, 0, 0, 0, 'L'),
                        new Two.Anchor(-0.1723*h, 0.2411*h, 0.0217*h, -0.0197*h, -0.0177*h, 0.016*h, 'C'),
                        new Two.Anchor(-0.2786*h, 0.2369*h, 0.0269*h, 0.0176*h, -0.0337*h, -0.022*h, 'C'),
                        new Two.Anchor(-0.2893*h, 0.0901*h, 0, 0, 0, 0, 'C'),
                        new Two.Anchor(-0.3858*h, 0.0936*h, 0.0683*h, -0.0181*h, 0.0302*h, -0.0771*h, 'C'),
                        new Two.Anchor(-0.3138*h, -0.0015*h, 0, 0, 0, 0, 'C'),
                        new Two.Anchor(-0.1045*h, -0.2517*h, -0.1715*h, 0.0009*h, 0.173*h, -0.0009*h, 'C'),
                        new Two.Anchor(0.1217*h, -0.0888*h, 0, 0, 0, 0, 'C'),
                        new Two.Anchor(0.2318*h, -0.2288*h, -0.0873*h, 0.0503*h, 0.0547*h, -0.0261*h, 'C'),
                        new Two.Anchor(0.3858*h, -0.1061*h, -0.0011*h, -0.105*h, 0.001*h, 0.0553*h, 'C'),
                        new Two.Anchor(0.2643*h, -0.0549*h, 0, 0, 0, 0, 'C')],
                        true, true, true);
                tortoise.fill = '#000000';
                tortoise.stroke = 'none';
                this.add(tortoise);
                break;
            case 6: // Design mode
                let b = two.makeCircle(-0.15*h,-0.15*h,0.2*h);
                let b1 = two.makeLine(-0.15*h,-0.15*h,0.3*h,0.3*h);
                let b2 = two.makeLine(-0.15*h,-0.15*h,-0.35*h,-0.35*h);
                b.fill = '#000000';
                b1.linewidth = h*.15;
                b2.linewidth = h*.15;
                b2.stroke = '#FFFFFF';
                this.add(b);
                this.add(b1);
                this.add(b2);
                break;

        }
        this.translation.x = x;
        this.translation.y = y;     
        this.id = "Icon"+i.toString();   
        two.add(this);
    }
}
class Digits extends Two.Group{
    constructor(x, y, h, two){
        super();
        this.digits = [new Digit(-h*4.9, 0, h, two), new Digit(-h*3.1, 0, h, two),
                       new Digit(-h*.9, 0, h, two), new Digit(h*.9, 0, h, two), 
                       new Digit(h*3.1, 0, h, two), new Digit(h*4.9, 0, h, two),
                       new Digit(h*2, 0, h, two, true), new Digit(-h*2, 0, h, two, true)];
        this.digits.forEach(el =>{this.add(el);});
        this.translation.x = x;
        this.translation.y = y;
        two.add(this);
        for(var n = 0; n < 6; n++){
            this.digits[n].setNum(0);
        }
    }
    setTime(ms){
        var z = Math.floor(ms/10);
        for(var n = 0; n < 6; n++){
            let d = (n==3) ? 6 : 10;
            let z1 = Math.floor(z/d);
            this.digits[5-n].setNum(z - z1*d);
            z = z1;
        }
    }
}
class Digit extends Two.Group{
    constructor(x, y, h, two, isSep=false){
        super();
        if(isSep){
            this.segs = [two.makeCircle(-0.4 / skewFactor, 0.4, 0.15), two.makeCircle(0.4 / skewFactor, -0.4, 0.15)];
            this.segs.forEach(el => {
                this.add(el);            
                this.fill = onCol;         
            });  
        } else {
        this.segs = [two.makePath(-0.6,-0.9, -0.5,-1, 0.5,-1, 0.6,-0.9, 0.5,-0.8, -0.5,-0.8, true),
            two.makePath(0.6,-0.9, 0.7,-0.8, 0.7,0, 0.6,0, 0.5,-0.1, 0.5,-0.8, true),
            two.makePath(0.6,0.9, 0.7,0.8, 0.7,0, 0.6,0, 0.5,0.1, 0.5,0.8, true),
            two.makePath(-0.6,0.9, -0.5,1, 0.5,1, 0.6,0.9, 0.5,0.8, -0.5,0.8, true),
            two.makePath(-0.6,0.9, -0.7,0.8, -0.7,0, -0.6,0, -0.5,0.1, -0.5,0.8, true),
            two.makePath(-0.6,-0.9, -0.7,-0.8, -0.7,0, -0.6,0, -0.5,-0.1, -0.5,-0.8, true),
            two.makePath(-0.6,0, -0.5,.1, 0.5,.1, 0.6,0, 0.5,-0.1, -0.5,-0.1, true)];
            this.segs.forEach(el => {
                this.skew(el);
                this.add(el);   
//                this.fill = '#AA00AA';         
            });  
        }

        this.translation.x = x;
        this.translation.y = y;
        this.scale = h;
        
        this.noStroke();
        two.add(this);
    }
    skew(el){
        el._collection.forEach(element => {
            element.x *= 0.9;
            element.y *= 0.9;
            element.x -= (element.y + el.position.y) / skewFactor;    
    });
    }
    setNum(z){
        for(var n = 0; n < 7; n++){
            this.segs[n].fill = (segDec[z][n]==1) ? onCol : offCol;
        }
    }
}

export { RobotGui }; 