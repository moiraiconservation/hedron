///////////////////////////////////////////////////////////////////////////////
// graph.js

const { DB } = require('./db.js');
const { RANDOM } = require('./random.js');
const random = new RANDOM();

function EDGE() {
	this.id = random.guid();
	this.parent_id = '';
	this.parent_index = 0;
	this.target_id = '';
	this.target_index = 0;
	this.type = '';
	this.weight = 1.0;

	this.clone = () => {
		const e = new EDGE();
		e.id = this.id;
		e.parent_id = this.parent_id;
		e.parent_index = this.parent_index;
		e.target_id = this.target_id;
		e.target_index = this.target_index;
		e.type = this.type;
		e.weight = this.weight;
		return e;
	}

}

function FD_OPTIONS() {
	// Standardized force-directed layout function options
	this.damping = 0.99;
	this.pixels_per_unit = 50.0;
	this.force_threshold = 1.00;
	this.ideal_spring_length = 1.00;
	this.max_iterations = 50;
	this.repulsion_constant = 2.00;
	this.spring_constant = 1.0;
}

function NODE() {
	this.attraction = { x: 0, y: 0, z: 0 };
	this.highlight = false;
	this.id = random.guid();
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
		n.highlight = this.highlight;
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

	this.degree = () => { return this.cargo.length; }

	this.euclidean_distance_to_node = (node_v) => {
		const v = this.vector_to_node(node_v);
		return Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
	}

	this.is_adjacent = (node_v) => {
		const target_index = node_v.index;
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
		const d = this.euclidean_distance_to_node(node);
		const v = this.vector_from_node(node);
		v.x = v.x / d;
		v.y = v.y / d;
		v.z = v.z / d;
		return v;
	}

	this.unit_vector_to_node = (node) => {
		const d = this.euclidean_distance_to_node(node);
		const v = this.vector_to_node(node);
		v.x = v.x / d;
		v.y = v.y / d;
		v.z = v.z / d;
		return v;
	}

	this.vector_from_node = (node_v) => {
		const vector = { x: 0, y: 0, z: 0 }
		vector.x = (node_v.x - this.x) * -1.0;
		vector.y = (node_v.y - this.y) * -1.0;
		vector.z = (node_v.z - this.z) * -1.0;
		return vector;
	}

	this.vector_to_node = (node_v) => {
		const vector = { x: 0, y: 0, z: 0 }
		vector.x = node_v.x - this.x;
		vector.y = node_v.y - this.y;
		vector.z = node_v.z - this.z;
		return vector;
	}

}

class GRAPH extends DB {

	constructor() { super(); }

	centroid() {
		const mean = new NODE();
		if (!this.cargo.length) { return mean; }
		for (let i = 0; i < this.cargo.length; i++) {
			mean.x += this.cargo[i].x;
			mean.y += this.cargo[i].y;
			mean.z += this.cargo[i].z;
		}
		mean.x /= this.cargo.length;
		mean.y /= this.cargo.length;
		mean.z /= this.cargo.length;
		return mean;
	}

	clear_forces() {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].clear_forces();
		}
	}

	clone() {	return super.clone(new GRAPH()); }

	distribution_of_euclidean_distances_to_node(node_u) {
		const index = node_u.index;
		const distribution = [];
		for (let i = 0; i < this.cargo.length; i++) {
			if (i !== index) {
				const node_v = this.cargo[i].clone();
				distribution.push(node_u.euclidean_distance_to_node(node_v));
			}
		}
		return distribution;
	}

	distribution_of_euclidean_distances() {
		const distribution = [];
		const coordinates = [];
		for (let u = 0; u < this.cargo.length; u++) {
			for (let v = u + 1; v < this.cargo.length; v++) {
				if (u !== v) {
					const node_u = this.cargo[u].clone();
					const node_v = this.cargo[v].clone();
					if (node_u.is_adjacent(node_v)) {
						const a = '(' + u.toString() + ',' + v.toString() + ')';
						const b = '(' + v.toString() + ',' + u.toString() + ')';
						if (!coordinates.includes(a) && !coordinates.includes(b)) {
							coordinates.push(a);
							coordinates.push(b);
							distribution.push(node_u.euclidean_distance_to_node(node_v));
						}
					}
				}
			}
		}
		return distribution;
	}

	force_directed_layout(graph, options) {
		// Eades 1984
		//	repulsive force:
		//		f_rep(u, v) = [repulsion constant / (Euclidean distance)^2] * unit vector_vu
		//	spring force:
		//		f_spring(u, v) = spring_constant * log(Euclidean distance / ideal spring length) * unit vector_uv
		//	attractive force:
		//		f_att(u, v) = f_spring(u, v) - f_rep(u, v)
		//	total force:
		//		f_total() = summation(f_att(u, v)) + summation(f_rep(u, v)) * damping

		const layout = graph || this.clone();
		options = options || new FD_OPTIONS();
		let iteration = 1;

		while (iteration < options.max_iterations) {
			let max_force = -Infinity;

			for (let u = 0; u < layout.cargo.length; u++) {
				layout.cargo[u].clear_forces();
				// calculate the repuslive force for each node
				for (let v = 0; v < layout.cargo.length; v++) {
					
					if (u !== v && !layout.cargo[u].locked) {
						const attraction = { x: 0, y: 0, z: 0 };
						const node_u = layout.cargo[u].clone();
						const node_v = layout.cargo[v].clone();
						const repulsion = { x: 0, y: 0, z: 0 };
						node_u.scale_coordinates(1 / options.pixels_per_unit);
						node_v.scale_coordinates(1 / options.pixels_per_unit);

						// find the Euclidean distance between nodes u and v
						const distance = node_u.euclidean_distance_to_node(node_v) || 1.0;

						// find the unit vectors for uv and vu
						const unit_uv = node_u.unit_vector_to_node(node_v);
						const unit_vu = node_u.unit_vector_from_node(node_v);

						// find the repulsive force
						const repulsion_factor = options.repulsion_constant / (distance * distance);
						repulsion.x = repulsion_factor * unit_vu.x;
						repulsion.y = repulsion_factor * unit_vu.y;
						repulsion.z = repulsion_factor * unit_vu.z;
						layout.cargo[u].repulsion.x += repulsion.x;
						layout.cargo[u].repulsion.y += repulsion.y;
						layout.cargo[u].repulsion.z += repulsion.z;
						
						// calculate the attractive force for adjacent nodes
						if (node_u.is_adjacent(node_v)) {
							const attraction_factor = options.spring_constant * Math.log(distance / options.ideal_spring_length);
							attraction.x = (attraction_factor * unit_uv.x) - repulsion.x;
							attraction.y = (attraction_factor * unit_uv.y) - repulsion.y;
							attraction.z = (attraction_factor * unit_uv.z) - repulsion.z;
							layout.cargo[u].attraction.x += attraction.x;
							layout.cargo[u].attraction.y += attraction.y;
							layout.cargo[u].attraction.z += attraction.z;
						}
					}
				} // done comparing u node to all v nodes

				layout.cargo[u].force.x = (layout.cargo[u].repulsion.x + layout.cargo[u].attraction.x) * options.damping;
				layout.cargo[u].force.y = (layout.cargo[u].repulsion.y + layout.cargo[u].attraction.y) * options.damping;
				layout.cargo[u].force.z = (layout.cargo[u].repulsion.z + layout.cargo[u].attraction.z) * options.damping;
				const force_magnitude = Math.sqrt((layout.cargo[u].force.x * layout.cargo[u].force.x) + (layout.cargo[u].force.y * layout.cargo[u].force.y) + (layout.cargo[u].force.z * layout.cargo[u].force.z));
				if (force_magnitude > max_force) { max_force = force_magnitude; }

			} // done searching all u nodes

			// convert back to screen scale
			for (let i = 0; i < layout.cargo.length; i++) {
				layout.cargo[i].x += Math.round(layout.cargo[i].force.x * options.pixels_per_unit);
				layout.cargo[i].y += Math.round(layout.cargo[i].force.y * options.pixels_per_unit);
				layout.cargo[i].z += Math.round(layout.cargo[i].force.z * options.pixels_per_unit);
			}

			options.damping = options.damping * options.damping;
			if (max_force < options.force_threshold) {
				if (graph) { return layout; }
				else { this.cargo = layout.cargo; return; }
			}
			iteration = iteration + 1;
		
		} // while loop

		if (graph) { return layout; }
		else { this.cargo = layout.cargo; return; }

	}

	filter_by(parameter, filter) { return super.filter_by(parameter, filter, new GRAPH()); }

	filter_by_id(id) { return this.filter_by('id', id); }

	filter_by_name(name) { return this.filter_by('name', name); }

	get_unique_ids() { return this.get_unique('id'); }

	get_unique_names() { return this.get_unique('name'); }

	graph_distance_between_nodes(node_u, node_v, threshold) {
		const hierarchy = [];
		if (!node_u || !node_v) { return hierarchy; }
		if (node_u.id === node_v.id) { return hierarchy; }
		threshold = threshold || 10000;
		let found = false;
		let level = 0;
		hierarchy.push([node_u.id]);
		while (!found && level < threshold) {
			let peers = [];
			let previous_level = [];
			if (level) { previous_level = hierarchy[level - 1]; }
			for (let i = 0; i < hierarchy[level].length; i++) {
				const filtered = this.filter_by('id', hierarchy[level][i]);
				if (filtered.cargo.length) {
					for (let j = 0; j < filtered.cargo[0].edges.length; j++) {
						if (!previous_level.includes(filtered.cargo[0].edges[j].target_id)) {
							peers.push(filtered.cargo[0].edges[j].target_id);
							if (filtered.cargo[0].edges[j].target_id === node_v.id) { found = true; }
						}
					}
				}
			}
			peers = Array.from(new Set(peers));
			level++;
			hierarchy.push(peers);
		}
		if (found) { return hierarchy.length; }
		else { return threshold; }
	}

	graph_distance_matrix(threshold) {
		const matrix = new Array(this.cargo.length);
		for (let u = 0; u < matrix.length; u++) {
			matrix[u] = new Array(this.cargo.length).fill(0);
		}
		for (let u = 0; u < matrix.length; u++) {
			const node_u = this.cargo[u];
			for (let v = u + 1; v < matrix[u].length; v++) {
				const node_v = this.cargo[v];
				matrix[u][v] = this.graph_distance_between_nodes(node_u, node_v, threshold);
				matrix[v][u] = matrix[u][v];
			}
		}
		return matrix;
	}

	hierarchy_between_nodes(node_u, node_v, threshold) {
		const hierarchy = [];
		if (!node_u || !node_v) { return hierarchy; }
		if (node_u.id === node_v.id) { return hierarchy; }
		threshold = threshold || 10000;
		let found = false;
		let level = 0;
		hierarchy.push([node_u.id]);
		while (!found && level < threshold) {
			let peers = [];
			let previous_level = [];
			if (level) { previous_level = hierarchy[level - 1]; }
			for (let i = 0; i < hierarchy[level].length; i++) {
				const filtered = this.filter_by('id', hierarchy[level][i]);
				if (filtered.cargo.length) {
					for (let j = 0; j < filtered.cargo[0].edges.length; j++) {
						if (!previous_level.includes(filtered.cargo[0].edges[j].target_id)) {
							peers.push(filtered.cargo[0].edges[j].target_id);
							if (filtered.cargo[0].edges[j].target_id === node_v.id) { found = true; }
						}
					}
				}
			}
			peers = Array.from(new Set(peers));
			level++;
			hierarchy.push(peers);
		}
		if (found) {
			for (let i = hierarchy[level].length; i >= 0; i--) {
				if (hierarchy[level][i] !== node_v.id) { hierarchy[level].splice(i, 1); }
			}
			let previous_level = hierarchy[level];
			for (let i = level - 1; i > 0; i--) {
				for (let j = hierarchy[i].length - 1; j >= 0; j--) {
					const filtered = this.filter_by('id', hierarchy[i][j]);
					if (filtered.cargo.length) {
						const targets = [];
						for (let k = 0; k < filtered.cargo[0].edges.length; k++) {
							targets.push(filtered.cargo[0].edges[k].target_id);
						}
						const linked = previous_level.some((x) => { return targets.includes(x); });
						if (!linked) { hierarchy[i].splice(j, 1); }
					}
					else { hierarchy[i].splice(j, 1); }
				}
				previous_level = hierarchy[i];
			}
		}
		return hierarchy;
	}

	highlight_all_nodes() { this.highlight_all(); }

	highlight_nodes(nodes) {
		if (!nodes) { return; }
		const new_graph = this.make_graph_from_nodes(nodes);
		const ids = new_graph.get_unique_ids();
		this.highlight_by('id', ids);

	}

	includes_all_ids(ids) { return this.includes_all('id', ids); }

	includes_all_indices(indices) { return this.includes_all('index', indices); }

	includes_all_names(names) { return this.includes_all('name', names); }

	includes_id(id) { return this.includes('id', id); }

	includes_index(index) { return this.includes('index', index); }

	includes_name(name) { return this.includes('name', name); }

	lock_all_nodes() { this.lock_all(); }

	lock_nodes(nodes) {
		if (!nodes) { return; }
		const new_graph = this.make_graph_from_nodes(nodes);
		const ids = new_graph.get_unique_ids();
		this.lock_by('id', ids);
	}

	make_2d() {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].z = 0;
		}
	}

	make_graph_from_nodes(nodes) {
		if (typeof (nodes.cargo) !== 'undefined') { return nodes; }
		const new_graph = new GRAPH();
		new_graph.load(nodes);
		return new_graph;
	}

	merge_subgraph(subgraph) {
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

	sort_by_degree() {
		this.cargo.sort((a, b) => {
			if (a.edges.length > b.edges.length) { return -1; }
			if (a.edges.length < b.edges.length) { return 1; }
			return 0;
		});
		this.update_indices();
	}

	subgraph_between_nodes(node_u, node_v, threshold) {
		let subgraph = new GRAPH();
		if (!node_u || !node_v) { return subgraph; }
		if (node_u.id === node_v.id) { return subgraph; }
		threshold = threshold || 10000;
		const hierarchy = this.hierarchy_between_nodes(node_u, node_v, threshold);
		const arr = [];
		for (let i = 0; i < hierarchy.length; i++) {
			for (let j = 0; j < hierarchy[i].length; j++) {
				arr.push(hierarchy[i][j]);
			}
		}
		const id_list = Array.from(new Set(arr));
		subgraph = this.filter_by_id(id_list);
		subgraph.update_indices();
		return subgraph;
	}

	subgraph_from_ids(ids) {
		let subgraph = new GRAPH();
		if (ids.length) {
			const nodes = this.filter_by_id(ids);
			if (nodes.cargo.length) {
				subgraph = this.subgraph_from_nodes(nodes);
			}
		}
		return subgraph;
	}

	subgraph_from_nodes(nodes) {
		let subgraph = new GRAPH();
		if (!nodes) { return subgraph; }
		if (nodes.cargo) { nodes = nodes.cargo; }
		if (!nodes.length) { return subgraph; }
		if (nodes.length === 1) {
			if (nodes[0].id) {
				subgraph = this.filter_by_id(nodes[0].id);
				subgraph.update_indices();
				}
			else { nodes[0] = new NODE(); }
			return subgraph;
		 }
		let arr = [];
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				if (i !== j) {
					const mini_graph = this.subgraph_between_nodes(nodes[i], nodes[j]);
					arr = arr.concat(mini_graph.get_unique('id'));
				}
			}
		}
		subgraph = this.filter_by_id(Array.from(new Set(arr)));
		subgraph.update_indices();
		subgraph.highlight_nodes(nodes);
		return subgraph;
	}

	unhighlight_all_nodes() { this.unhighlight_all(); }

	unhighlight_nodes(nodes) {
		if (!nodes) { return; }
		const new_graph = this.make_graph_from_nodes(nodes);
		const ids = new_graph.get_unique_ids();
		this.unhighlight_by('id', ids);

	}

	unlock_all_nodes() { this.unlock_all(); }

	unlock_nodes(nodes) {
		if (!nodes) { return; }
		const new_graph = this.make_graph_from_nodes(nodes);
		const ids = new_graph.get_unique_ids();
		this.unlock_by('id', ids);
	}

	update_indices() {
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