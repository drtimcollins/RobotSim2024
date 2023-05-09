class CircleTree{
	constructor(p){
		this.parent = [-1];	// parent of each node
		this.children = [[]];		
		this.p = p;	// Points (complex)
		this.N = 1;	// Num nodes
		this.circles = [this.computeBoundingCircle()];
		this.buildTree(0, Array.apply(null, { length: this.p.length }).map(Function.call, Number));
	}

	nearestPoint(z, startNode = 0, bestNode = {distance:-1, index: -1}){
		if(bestNode.index == -1){
			bestNode.index = this.circles[this.N - 1].index;
			bestNode.distance = math.subtract(z, this.circles[this.N - 1].centre).abs();
		}
		if(math.subtract(z, this.circles[startNode].centre).abs() - this.circles[startNode].rad < bestNode.distance ){
			if(this.children[startNode].length == 0){
				if(math.subtract(z, this.circles[startNode].centre).abs() < bestNode.distance){
					bestNode.distance = math.subtract(z, this.circles[startNode].centre).abs();
					bestNode.index = this.circles[startNode].index;
				}
			} else {
				for(let n = 0; n < this.children[startNode].length; n++){
					bestNode = this.nearestPoint(z, this.children[startNode][n], bestNode);
				}
			}
		}
		return bestNode;
	}

	buildTree(startNode, k0){
		// startNode = node of exisiting tree to begin from
		// k0        = array of indices to the vertices in g that are in this branch of the tree
		const scales = [[-1,-1],[-1, 1],[1,1],[1,-1]];	// Quadtree sector definitions
		for(let n = 0; n < 4; n++){
			let kn = [];
			// Get subarray of point indices within this quadrant
			for(let m = 0; m < k0.length; m++){
				let vdiff = math.subtract(this.p[k0[m]], this.circles[startNode].centre);
				if(scales[n][0]*vdiff.re > 0 && scales[n][1]*vdiff.im > 0){
					kn.push(k0[m]);
				}
			}
			// Build new tree/branch with points subset, or a leaf if there is only one point
			if(kn.length > 0){
				this.N++;
				this.circles.push(this.computeBoundingCircle(kn));
				this.parent.push(startNode);
				this.children.push([]);
				this.children[startNode].push(this.N - 1);
				if (kn.length > 1) {
					this.buildTree(this.N - 1, kn);
				}
			}
		}
	}

	computeBoundingCircle(k = null){
		let z = 0;
		var result = {};		
		if(k==null) k = [...Array(this.p.length).keys()];
		for(let n = 0; n < k.length; n++){
			z = math.add(z, this.p[k[n]]);
		}
		result.centre = math.multiply(z, 1/k.length);
		result.rad = 0;
		for(let n = 0; n < k.length; n++){
			let r = math.subtract(result.centre, this.p[k[n]]).abs();
			result.rad = Math.max(r, result.rad);
		}		
		if(k.length == 1) result.index = k[0];
		//result.rad = max(result.rad, 10);	// TEMP FOR VISUALISATION
		return result;
	}

	draw(){
		stroke(0,255,0);		
		for(let n = 0; n < this.N; n++)
			circle(this.circles[n].centre.re, this.circles[n].centre.im, this.circles[n].rad * 2);		
	}
}

export { CircleTree };