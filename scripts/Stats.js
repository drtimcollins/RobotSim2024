class Stats{
	constructor(){
		//this.beginTime = 
		this.prevTime = ( performance || Date ).now();
		this.checkTime = this.prevTime;
		this.frames = 0;
		this.fps = 0;
		this.bad = false;
		this.good = true;
		this.checkMe = false;
    }
	update(){
		this.frames++;
		var time = ( performance || Date ).now();
		if ( time >= this.prevTime + 1000 ) {
			var newfps = ( this.frames * 1000 ) / ( time - this.prevTime );
			this.bad = (newfps < 20 && this.fps < 20);
			this.good = (newfps > 30 && this.fps > 30);
			this.fps = newfps;
			this.prevTime = time;
			this.frames = 0;
			//console.log(this.fps);
		}		
		if ( time >= this.checkTime + 2000 && this.frames > 200) {
			this.checkMe = true;
			this.checkTime = time;
		}
	}
}

export {Stats};