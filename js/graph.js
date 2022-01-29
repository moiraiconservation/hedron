///////////////////////////////////////////////////////////////////////////////
// graph.js

function EDGE() {
	this.parent_id = '';
	this.parent_index = 0;
	this.target_id = '';
	this.target_index = 0;
	this.type = '';
	this.weight;

	this.clone = () => {
		const e = new EDGE();
		e.parent_id = this.parent_id;
		e.parent_index = this.parent_index;
		e.target_id = this.target_id;
		e.target_index = this.target_index;
		e.type = this.type;
		e.weight = this.weight;
		return e;
	}

}

function FDL_OPTIONS() {
	// Standardized force-directed layout function options.
	//	Note: Not all options might be used by specific
	//	force-directed algorithms.
	this.damping = 0.99;
	this.pixels_per_unit = 20;
	this.force_threshold = 1.00;
	this.ideal_spring_length = 15.00;
	this.max_iterations = 10000;
	this.repulsion_constant = 250.00;
	this.spring_constant = 2.0;
}

function NODE() {
	this.attraction = { x: 0, y: 0 };
	this.id = '';
	this.index = 0;
	this.name = '';
	this.edges = [];
	this.force = { x: 0, y: 0 };
	this.radius = 10;
	this.repulsion = { x: 0, y: 0 };
	this.type = '';
	this.x = Math.floor(Math.random() * 1000);
	this.y = Math.floor(Math.random() * 1000);

	this.clone = () => {
		const n = new NODE();
		n.attraction.x = this.attraction.x;
		n.attraction.y = this.attraction.y;
		n.id = this.id;
		n.index = this.index;
		n.name = this.name;
		for (let i = 0; i < this.edges.length; i++) {
			const e = this.edges[i].clone();
			n.edges.push(e);
		}
		n.force.x = this.force.x;
		n.force.y = this.force.y;
		n.radius = this.radius;
		n.repulsion.x = this.repulsion.x;
		n.repulsion.y = this.repulsion.y;
		n.type = this.type;
		n.x = this.x;
		n.y = this.y;
		return n;
	}

	this.is_adjacent = (target_index) => {
		const index = this.edges.findIndex((x) => { return x.target_index === target_index });
		if (index >= 0) { return true; }
		return false;
	}

}

function GRAPH() {

	this.cargo = [];

	this.add = (node) => { this.cargo.push(node); }

	this.clear = () => { this.cargo = []; }

	this.clone = () => {
		const g = new GRAPH();
		g.cargo = this.clone_cargo();
		return g;
	}

	this.clone_cargo = () => {
		const cargo = [];
		for (let i = 0; i < this.cargo.length; i++) {
			cargo.push(this.cargo[i].clone());
		}
		return cargo;
	}

	this.export_as_json = () => {
		return JSON.stringify(this.cargo);
	}

	this.force_directed_layout_Ead84 = (options) => {
		// Eades 1984
		//	repulsive force:
		//		f_rep(u, v) = [repulsion constant / (Euclidean distance)^2] * unit vector_vu
		//	spring force:
		//		f_spring(u, v) = spring_constant * log(Euclidean distance / ideal spring length) * unit vector_uv
		//	attractive force:
		//		f_att(u, v) = f_spring(u, v) - f_rep(u, v)
		//	total force:
		//		f_total() = summation(f_att(u, v)) + summation(f_rep(u, v)) * damping

		options = options || new FDL_OPTIONS();
		let debug = false;
		let iteration = 1;

		while (iteration < options.max_iterations) {
			if (debug) { console.log('Iteration: ' + iteration); }
			let max_force = -Infinity;
			for (let u = 0; u < this.cargo.length; u++) {
				this.cargo[u].attraction.x = 0.0;
				this.cargo[u].attraction.y = 0.0;
				this.cargo[u].repulsion.x = 0.0;
				this.cargo[u].repulsion.y = 0.0;
				// calculate the repuslive force for each node
				for (let v = 0; v < this.cargo.length; v++) {
					if (u !== v) {
						
						const attraction = { x: 0, y: 0 };
						const node_u = this.cargo[u].clone();
						const node_v = this.cargo[v].clone();
						const repulsion = { x: 0, y: 0 };
						const unit_uv = { x: 0, y: 0 };
						const unit_vu = { x: 0, y: 0 };
						const vector_uv = { x: 0, y: 0 };
						const vector_vu = { x: 0, y: 0 };
						node_u.x = this.cargo[u].x / options.pixels_per_unit;
						node_u.y = this.cargo[u].y / options.pixels_per_unit;
						node_v.x = this.cargo[v].x / options.pixels_per_unit;
						node_v.y = this.cargo[v].y / options.pixels_per_unit;

						// find the Euclidean distance between nodes u and v
						const delta_x = (node_v.x - node_u.x);
						const delta_y = (node_v.y - node_u.y);
						const distance = Math.sqrt((delta_x * delta_x) + (delta_y * delta_y)) || 1.0;

						// find the unit vectors for uv and vu
						vector_uv.x = (node_v.x - node_u.x);
						vector_uv.y = (node_v.y - node_u.y);
						vector_vu.x = (node_v.x - node_u.x) * -1.0;
						vector_vu.y = (node_v.y - node_u.y) * -1.0;
						unit_vu.x = vector_vu.x / distance;
						unit_vu.y = vector_vu.y / distance;
						unit_uv.x = vector_uv.x / distance;
						unit_uv.y = vector_uv.y / distance;						

						// find the repulsive force
						const repulsion_factor = options.repulsion_constant / (distance * distance);
						repulsion.x = repulsion_factor * unit_vu.x;
						repulsion.y = repulsion_factor * unit_vu.y;
						this.cargo[u].repulsion.x += repulsion.x;
						this.cargo[u].repulsion.y += repulsion.y;
						
						if (debug) {
							console.log('======================');
							console.log('Node u: { x: ' + node_u.x + ', y: ' + node_u.y + ' }');
							console.log('Node v: { x: ' + node_v.x + ', y: ' + node_v.y + ' }');
							console.log('======================');
							console.log('Distance: ' + distance);
							console.log('Vector from u to v: { x: ' + vector_uv.x + ', y: ' + vector_uv.y + ' }');
							console.log('Unit vector from u to v: { x: ' + unit_uv.x + ', y: ' + unit_uv.y + ' }');
							console.log('Vector from v to u: { x: ' + vector_vu.x + ', y: ' + vector_vu.y + ' }');
							console.log('Unit vector from v to u: { x: ' + unit_vu.x + ', y: ' + unit_vu.y + ' }');
							console.log('======================');
							console.log('Repulsion factor: ' + repulsion_factor);
							console.log('Repulsion force: { x: ' + repulsion.x + ', y: ' + repulsion.y + ' }');
						}

						// calculate the attractive force for adjacent nodes
						if (node_u.is_adjacent(v)) {

							const attraction_factor = options.spring_constant * Math.log(distance / options.ideal_spring_length);
							attraction.x = (attraction_factor * unit_uv.x) - repulsion.x;
							attraction.y = (attraction_factor * unit_uv.y) - repulsion.y;
							this.cargo[u].attraction.x += attraction.x;
							this.cargo[u].attraction.y += attraction.y;
							
							if (debug) {
								console.log('======================');
								console.log('Attraction factor: ' + attraction_factor);
								console.log('Attraction force: { x: ' + attraction.x + ', y: ' + attraction.y + ' }');
								console.log('======================');
								console.log(' ');
								console.log(dkjhfjkds.dsfjhkj);
							}

						}
					}
				} // done comparing u node to all v nodes

				this.cargo[u].force.x = (this.cargo[u].repulsion.x + this.cargo[u].attraction.x) * options.damping;
				this.cargo[u].force.y = (this.cargo[u].repulsion.y + this.cargo[u].attraction.y) * options.damping;
				const force_magnitude = Math.round(Math.sqrt((this.cargo[u].force.x * this.cargo[u].force.x) + (this.cargo[u].force.y * this.cargo[u].force.y)));
				if (force_magnitude > max_force) { max_force = force_magnitude; }

			} // done searching all u nodes

			// convert back to screen scale
			for (let i = 0; i < this.cargo.length; i++) {
				this.cargo[i].x += this.cargo[i].force.x * options.pixels_per_unit;
				this.cargo[i].y += this.cargo[i].force.y * options.pixels_per_unit;
			}

			options.damping = options.damping * options.damping;
			if (max_force < options.force_threshold) {
				if (debug) { console.log('Tiny force!'); }
				return;
			}
			iteration = iteration + 1;
		
		} // while loop

		if (debug) { console.log('Maximum time passed!'); }
		return;
	}

}

module.exports = { EDGE: EDGE, NODE: NODE, GRAPH: GRAPH }