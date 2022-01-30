///////////////////////////////////////////////////////////////////////////////
// graph.js

const { IO } = require('./io.js');
const { PATHER } = require('./pather.js');
const { STATS } = require('./stats.js');
const io = new IO();
const pather = new PATHER();

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
	this.attraction = { x: 0, y: 0, z: 0 };
	this.id = '';
	this.index = 0;
	this.locked = false;
	this.name = '';
	this.edges = [];
	this.force = { x: 0, y: 0, z: 0 };
	this.radius = 10;
	this.repulsion = { x: 0, y: 0, z: 0 };
	this.type = '';
	this.x = Math.floor(Math.random() * 1000);
	this.y = Math.floor(Math.random() * 1000);
	this.z = Math.floor(Math.random() * 1000);

	this.clear_forces = () => {
		this.attraction.x = 0;
		this.attraction.y = 0;
		this.attraction.z = 0;
		this.force.x = 0;
		this.force.y = 0;
		this.force.z = 0;
		this.repulsion.x = 0;
		this.repulsion.y = 0;
		this.repulsion.z = 0;
	}

	this.clone = () => {
		const n = new NODE();
		n.attraction.x = this.attraction.x;
		n.attraction.y = this.attraction.y;
		n.attraction.z = this.attraction.z;
		n.id = this.id;
		n.index = this.index;
		n.locked = this.locked;
		n.name = this.name;
		for (let i = 0; i < this.edges.length; i++) {
			const e = this.edges[i].clone();
			n.edges.push(e);
		}
		n.force.x = this.force.x;
		n.force.y = this.force.y;
		n.force.z = this.force.z;
		n.radius = this.radius;
		n.repulsion.x = this.repulsion.x;
		n.repulsion.y = this.repulsion.y;
		n.repulsion.z = this.repulsion.z;
		n.type = this.type;
		n.x = this.x;
		n.y = this.y;
		n.z = this.z;
		return n;
	}

	this.distance_to_node = (node) => {
		const v = this.vector_to_node(node);
		return Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
	}

	this.is_adjacent = (target_index) => {
		const index = this.edges.findIndex((x) => { return x.target_index === target_index });
		if (index >= 0) { return true; }
		return false;
	}

	this.offset_coordinates = (x, y, z) => {
		x = x || 0;
		y = y || 0;
		z = z || 0;
		this.x += x;
		this.y += y;
		this.z += z;
	}

	this.scale_coordinates = (scale) => {
		scale = scale || 1.0;
		this.x *= scale;
		this.y *= scale;
		this.z *= scale;
	}

	this.set_coordinates = (x, y, z) => {
		x = x || 0;
		y = y || 0;
		z = z || 0;
		this.x = x;
		this.y = y;
		this.z = z;
	}

	this.unit_vector_from_node = (node) => {
		const d = this.distance_to_node(node);
		const v = this.vector_from_node(node);
		v.x = v.x / d;
		v.y = v.y / d;
		v.z = v.z / d;
		return v;
	}

	this.unit_vector_to_node = (node) => {
		const d = this.distance_to_node(node);
		const v = this.vector_to_node(node);
		v.x = v.x / d;
		v.y = v.y / d;
		v.z = v.z / d;
		return v;
	}

	this.vector_from_node = (node) => {
		const vector = { x: 0, y: 0, z: 0 }
		vector.x = (node.x - this.x) * -1.0;
		vector.y = (node.y - this.y) * -1.0;
		vector.z = (node.z - this.z) * -1.0;
		return vector;
	}

	this.vector_to_node = (node) => {
		const vector = { x: 0, y: 0, z: 0 }
		vector.x = node.x - this.x;
		vector.y = node.y - this.y;
		vector.z = node.z - this.z;
		return vector;
	}

}

function GRAPH() {

	this.cargo = [];

	this.add = (node) => { this.cargo.push(node); }

	this.clear = () => { this.cargo = []; }

	this.clear_forces = () => {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].clear_forces();
		}
	}

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

	this.create_subgraph_from_index = (index, levels) => {
		const added = [];
		const g = new GRAPH();
		let list = [];
		if (typeof (index) === 'undefined') { return g; }
		levels = levels || 0;
		g.add(this.cargo[index].clone());
		added.push(index);
		list.push(this.cargo[index].clone());
		while (levels > 0) {
			for (let i = 0; i < list.length; i++) {
				const new_list = [];
				for (let j = 0; j < list[i].edges.length; j++) {
					const edge = list[i].edges[j];
					if (!added.includes(edge.target_index)) {
						g.add(this.cargo[edge.target_index].clone());
						added.push(edge.target_index);
						new_list.push(this.cargo[edge.target_index].clone());
					}
				}
				list = new_list;
			}
			levels = levels - 1;
		}
		g.update_indices();
		return g;
	}

	this.distance_distribution_from_index = (index) => {
		const node_u = this.cargo[index].clone();
		return this.distance_distribution_from_node(node_u);
	}

	this.distance_distribution_from_node = (node_u) => {
		const index = node_u.index;
		const distribution = [];
		for (let i = 0; i < this.cargo.length; i++) {
			if (i !== index) {
				const node_v = this.cargo[i].clone();
				distribution.push(node_u.distance_to_node(node_v));
			}
		}
		return distribution;
	}

	this.export_as_json = () => {
		return JSON.stringify(this.cargo);
	}

	this.force_directed_layout = (options) => {
		// This is a custom force-directed graph layout algorithm.
		//	In short: The nodes are sorted in order based on their
		//	number of connecting edges (largest to smallest). The
		//	nodes are then taken one-at-a-time, in order, and used
		//	to generate subgraphs of connected nodes, at least 30
		//	nodes in size. These subgraphs are organized using the
		//	Eades 1984 (Ead84) algorithm. Organized subgraphs are
		//	positioned so they do not substantially overlap, using
		//	their inter-quartile range of node distances as an
		//	approximation for the radius of each subgraph. Once
		//	positioned and organized, each subgraph is locked (so
		//	the x and y coordinates can no longer be adjested), and
		//	then merged back into the main graph data structure.

		function BUBBLE() {
			this.radius = 0;
			this.x = 0;
			this.y = 0;
		}

		function BUBBLES() {
			this.cargo = [];
			
			this.add = (bubble) => {
				this.cargo.push(bubble);
			}

			this.check_for_overlap = (bubble) => {
				for (let i = 0; i < this.cargo.length; i++) {
					const delta_x = bubble.x - this.cargo[i].x;
					const delta_y = bubble.y - this.cargo[i].y;
					const distance = Math.sqrt((delta_x * delta_x) + (delta_y * delta_y));
					if (distance < (this.cargo[i].radius + bubble.radius)) { return true; }
				}
				return false;
			}

		}

		options = options || new FDL_OPTIONS();
		let angle = 0;
		let circumference = 2 * Math.PI;
		let radius = 0;
		let x = 100;
		let y = 100;
		const bubbles = new BUBBLES();
		const stats = new STATS();
		this.sort_by_number_of_edges();
		for (let i = 0; i < this.cargo.length; i++) {
			let levels = 1;
			let size = 0;
			var subgraph;
			if (!this.cargo[i].locked) {
				this.cargo[i].x = x;
				this.cargo[i].y = y;				
			}
			while (size < 30) {
				subgraph = this.create_subgraph_from_index(i, levels);
				const new_size = subgraph.cargo.length;
				if (size === new_size) { break; }
				size = new_size;
			}
			x = subgraph.cargo[0].x;
			y = subgraph.cargo[0].y;
			subgraph.cargo[0].locked = true;
			subgraph.force_directed_layout_Ead84(undefined, options);
			stats.load(subgraph.distance_distribution_from_index(0));
			const quartiles = stats.quartiles();
			let iqr = options.ideal_spring_length;
			if (quartiles && quartiles.iqr) { iqr = quartiles.iqr; }
			const bubble = new BUBBLE();
			bubble.radius = iqr;
			bubble.x = x;
			bubble.y = y;
			bubbles.add(bubble);
			const next_bubble = new BUBBLE();
			radius = 2.5 * iqr;
			next_bubble.radius = iqr;
			next_bubble.x = x + (radius * Math.cos(angle));
			next_bubble.y = y + (radius * Math.sin(angle));
			while (bubbles.check_for_overlap(next_bubble)) {
				let new_angle = angle + 0.0174533;
				if (new_angle > circumference) { radius = radius + iqr; }
				angle = new_angle % circumference;
				next_bubble.x = x + radius * Math.cos(angle);
				next_bubble.y = y + radius * Math.sin(angle);
			}
			x = next_bubble.x;
			y = next_bubble.y
			subgraph.lock_nodes();
			this.merge_subgraph_by_id(subgraph);
		}
		this.unlock_nodes();

	}

	this.force_directed_layout_Ead84 = (graph, options) => {
		// Eades 1984
		//	repulsive force:
		//		f_rep(u, v) = [repulsion constant / (Euclidean distance)^2] * unit vector_vu
		//	spring force:
		//		f_spring(u, v) = spring_constant * log(Euclidean distance / ideal spring length) * unit vector_uv
		//	attractive force:
		//		f_att(u, v) = f_spring(u, v) - f_rep(u, v)
		//	total force:
		//		f_total() = summation(f_att(u, v)) + summation(f_rep(u, v)) * damping

		const layout = graph || this.cargo;
		options = options || new FDL_OPTIONS();
		let iteration = 1;

		while (iteration < options.max_iterations) {
			let max_force = -Infinity;

			for (let u = 0; u < layout.length; u++) {
				layout[u].clear_forces();
				
				// calculate the repuslive force for each node
				for (let v = 0; v < layout.length; v++) {
					
					if (u !== v && !layout[u].locked) {
						const attraction = { x: 0, y: 0, z: 0 };
						const node_u = layout[u].clone();
						const node_v = layout[v].clone();
						const repulsion = { x: 0, y: 0, z: 0 };
						node_u.scale_coordinates(1 / options.pixels_per_unit);
						node_v.scale_coordinates(1 / options.pixels_per_unit);

						// find the Euclidean distance between nodes u and v
						const distance = node_u.distance_to_node(node_v) || 1.0;

						// find the unit vectors for uv and vu
						const unit_uv = node_u.unit_vector_to_node(node_v);
						const unit_vu = node_u.unit_vector_from_node(node_v);

						// find the repulsive force
						const repulsion_factor = options.repulsion_constant / (distance * distance);
						repulsion.x = repulsion_factor * unit_vu.x;
						repulsion.y = repulsion_factor * unit_vu.y;
						repulsion.z = repulsion_factor * unit_vu.z;
						layout[u].repulsion.x += repulsion.x;
						layout[u].repulsion.y += repulsion.y;
						layout[u].repulsion.z += repulsion.z;
						
						// calculate the attractive force for adjacent nodes
						if (node_u.is_adjacent(v)) {
							const attraction_factor = options.spring_constant * Math.log(distance / options.ideal_spring_length);
							attraction.x = (attraction_factor * unit_uv.x) - repulsion.x;
							attraction.y = (attraction_factor * unit_uv.y) - repulsion.y;
							attraction.z = (attraction_factor * unit_uv.z) - repulsion.z;
							layout[u].attraction.x += attraction.x;
							layout[u].attraction.y += attraction.y;
							layout[u].attraction.z += attraction.z;
						}
					}
				} // done comparing u node to all v nodes

				layout[u].force.x = (layout[u].repulsion.x + layout[u].attraction.x) * options.damping;
				layout[u].force.y = (layout[u].repulsion.y + layout[u].attraction.y) * options.damping;
				layout[u].force.z = (layout[u].repulsion.z + layout[u].attraction.z) * options.damping;
				const force_magnitude = Math.round(Math.sqrt((layout[u].force.x * layout[u].force.x) + (layout[u].force.y * layout[u].force.y) + (layout[u].force.z * layout[u].force.z)));
				if (force_magnitude > max_force) { max_force = force_magnitude; }

			} // done searching all u nodes

			// convert back to screen scale
			for (let i = 0; i < layout.length; i++) {
				layout[i].x += layout[i].force.x * options.pixels_per_unit;
				layout[i].y += layout[i].force.y * options.pixels_per_unit;
				layout[i].z += layout[i].force.z * options.pixels_per_unit;
			}

			options.damping = options.damping * options.damping;
			if (max_force < options.force_threshold) {
				if (graph) { return layout; }
				else { this.cargo = layout; return; }
			}
			iteration = iteration + 1;
		
		} // while loop

		if (graph) { return layout; }
		else { this.cargo = layout; return; }

	}

	this.lock_nodes = () => {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].clear_forces();
			this.cargo[i].locked = true;
		}
	}

	this.make_2d = () => {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].z = 0;
		}
	}

	this.merge_subgraph_by_id = (subgraph) => {
		if (typeof (subgraph) === 'undefined') { return; }
		for (let i = 0; i < this.cargo.length; i++) {
			const nodes = subgraph.cargo.filter((x) => { return x.id === this.cargo[i].id; });
			for (let j = 0; j < nodes.length; j++) {
				const clone = nodes[j].clone();
				clone.index = this.cargo[i].index;
				clone.edges = [];
				for (let k = 0; k < this.cargo[i].edges.length; k++) {
					clone.edges.push(this.cargo[i].edges[k].clone());
				}
				this.cargo[i] = clone;
			}
		}
	}

	this.merge_subgraph_by_name = (subgraph) => {
		if (typeof (subgraph) === 'undefined') { return; }
		for (let i = 0; i < this.cargo.length; i++) {
			const nodes = subgraph.cargo.filter((x) => { return x.name === this.cargo[i].name; });
			for (let j = 0; j < nodes.length; j++) {
				const clone = nodes[j].clone();
				clone.index = this.cargo[i].index;
				clone.edges = [];
				for (let k = 0; k < this.cargo[i].edges.length; k++) {
					clone.edges.push(this.cargo[i].edges[k].clone());
				}
				this.cargo[i] = clone;
			}
		}
	}

	this.save_as_json = async (path) => {
		if (typeof (path) === 'undefined') { path = ''; }
		const path_record = await pather.parse(path);
		if (!path_record.filename) { await path_record.set_file_name(this.create_file_name('graph')); }
		await path_record.set_extension('txt');
		await path_record.force_path();
		const full_path = await path_record.get_full_path();
		const contents = this.export_as_json();
		await io.write_file(full_path, contents);
	}

	this.sort_by_number_of_edges = () => {
		this.cargo.sort((a, b) => {
			if (a.edges.length > b.edges.length) { return -1; }
			if (a.edges.length < b.edges.length) { return 1; }
			return 0;
		});
		this.update_indices();
	}

	this.unlock_nodes = () => {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].locked = false;
		}
	}

	this.update_indices = () => {
		const updated = [];
		for (let i = 0; i < this.cargo.length; i++) {
			const new_index = i;
			const old_index = this.cargo[i].index;
			this.cargo[i].index = new_index;
			for (let j = 0; j < this.cargo.length; j++) {
				for (let k = 0; k < this.cargo[j].edges.length; k++) {
					this.cargo[j].edges[k].parent_index = j;
					if (this.cargo[j].edges[k].target_index === old_index) {
						if (!updated.includes(j.toString() + ',' + k.toString())) {
							this.cargo[j].edges[k].target_index = new_index;
							updated.push(j.toString() + ',' + k.toString());
						}
					}
				}
			}
		}
		// remove non-updated edges
		for (let j = 0; j < this.cargo.length; j++) {
			for (let k = this.cargo[j].edges.length - 1; k >= 0; k--) {
				if (!updated.includes(j.toString() + ',' + k.toString())) {
					this.cargo[j].edges.splice(k, 1);
				}
			}
		}
	}

}

module.exports = { EDGE: EDGE, NODE: NODE, GRAPH: GRAPH }