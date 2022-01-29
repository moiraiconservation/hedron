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

	this.force_directed_layout_Ead84 = () => {
		// Eades 1984
		let damping = 1.00;
		const force_threshold = 1.00;
		const ideal_spring_length = 0.01;
		const max_iterations = 1000;
		const pixels_per_unit = 10;
		const repulsion_constant = 2.00;
		const spring_constant = 1.0;
		let t = 1;

		while (t < max_iterations) {
			let max_force = -Infinity;
			for (let i = 0; i < this.cargo.length; i++) {
				console.log('Time: ' + t + ', Index i: ' + i);
				this.cargo[i].attraction.x = 0.0;
				this.cargo[i].attraction.y = 0.0;
				this.cargo[i].repulsion.x = 0.0;
				this.cargo[i].repulsion.y = 0.0;
				// calculate the repuslive force for each node
				for (let j = 0; j < this.cargo.length; j++) {
					if (i !== j) {
						let sum = 0;
						const node_i = this.cargo[i];
						const node_j = this.cargo[j];
						// find the Euclidean distance between nodes i and j
						const delta_x = (node_j.x - node_i.x) / pixels_per_unit;
						const delta_y = (node_j.y - node_i.y) / pixels_per_unit;
						sum += (delta_x * delta_x);
						sum += (delta_y * delta_y);
						sum = sum || 1.0;
						const distance = Math.sqrt(sum);
						// find the unit vector between nodes i and j
						const unit_r = { x: 0, y: 0 }
						const vector_r = { x: 0, y: 0 }
						vector_r.x = node_i.x - node_j.x;
						vector_r.y = node_i.y - node_j.y;
						const magnitude_r = Math.sqrt((vector_r.x * vector_r.x) + (vector_r.y * vector_r.y)) || 1;
						unit_r.x = vector_r.x / magnitude_r;
						unit_r.y = vector_r.y / magnitude_r;
						// find the repulsive force
						const factor_r = repulsion_constant / (distance * distance);
						const r_x = factor_r * unit_r.x;
						const r_y = factor_r * unit_r.y;
						const repulsion = { x: r_x, y: r_y };
						this.cargo[i].repulsion.x += repulsion.x;
						this.cargo[i].repulsion.y += repulsion.y;
						/*
						console.log('Node i: { x: ' + node_i.x + ', y: ' + node_i.y + ' }');
						console.log('Node j: { x: ' + node_j.x + ', y: ' + node_j.y + ' }');
						console.log('======================');
						console.log('Vector from j to i: { x: ' + vector_r.x + ', y: ' + vector_r.y + ' }');
						console.log('Magnitude: ' + magnitude_r);
						console.log('Unit vector from j to i: { x: ' + unit_r.x + ', y: ' + unit_r.y + ' }');
						console.log('Factor: ' + factor_r);
						console.log('Repulsion force: { x: ' + repulsion.x + ', y: ' + repulsion.y + ' }');
						*/
						// calculate the attractive force for adjacent nodes
						if (node_i.is_adjacent(j)) {
							const vector_a = { x: 0, y: 0 }
							const unit_a = { x: 0, y: 0 }
							vector_a.x = (node_j.x - node_i.x) * pixels_per_unit;
							vector_a.y = (node_j.y - node_i.y) / pixels_per_unit;
							const magnitude_a = Math.sqrt((vector_a.x * vector_a.x) + (vector_a.y * vector_a.y)) || 1;
							unit_a.x = vector_a.x / magnitude_a;
							unit_a.y = vector_a.y / magnitude_a;
							const factor_a = spring_constant * Math.log(distance / ideal_spring_length);
							const a_x = (factor_a * unit_a.x) - repulsion.x;
							const a_y = (factor_a * unit_a.y) - repulsion.y;
							const attraction = { x: a_x, y: a_y }
							this.cargo[i].attraction.x += attraction.x;
							this.cargo[i].attraction.y += attraction.y;
							/*
							console.log('======================');
							console.log('Vector from i to j: { x: ' + vector_a.x + ', y: ' + vector_a.y + ' }');
							console.log('Magnitude: ' + magnitude_a);
							console.log('Unit vector from i to j: { x: ' + unit_a.x + ', y: ' + unit_a.y + ' }');
							console.log('Factor: ' + factor_a);
							console.log('Attraction force: { x: ' + attraction.x + ', y: ' + attraction.y + ' }');
							console.log(' ');
							console.log(dkjhfjkds.dsfjhkj);
							*/
						}
					}
				}
				this.cargo[i].force.x = (this.cargo[i].repulsion.x + this.cargo[i].attraction.x) * damping;
				this.cargo[i].force.y = (this.cargo[i].repulsion.y + this.cargo[i].attraction.y) * damping;
				const force_magnitude = Math.sqrt((this.cargo[i].force.x * this.cargo[i].force.x) + (this.cargo[i].force.y * this.cargo[i].force.y));
				if (force_magnitude > max_force) { max_force = force_magnitude; }
			}
			for (let i = 0; i < this.cargo.length; i++) {
				this.cargo[i].x += this.cargo[i].force.x * pixels_per_unit;
				this.cargo[i].y += this.cargo[i].force.y * pixels_per_unit;
			}
			damping = damping * damping;
			if (max_force < force_threshold) {
				console.log('Tiny force!');
				return;
			}
			t = t + 1;
		}
		console.log('Maximum time passed!');
		return;
	}

}

module.exports = { EDGE: EDGE, NODE: NODE, GRAPH: GRAPH }