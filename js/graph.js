///////////////////////////////////////////////////////////////////////////////
// graph.js

const { IO } = require('./io.js');
const { PATHER } = require('./pather.js');
const { RANDOM } = require('./random.js');
const { STATS } = require('./stats.js');
const io = new IO();
const pather = new PATHER();
const random = new RANDOM();
const stats = new STATS();

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
	// Standardized force-directed layout function options.
	this.damping = 0.99;
	this.pixels_per_unit = 50;
	this.force_threshold = 1.00;
	this.ideal_spring_length = 1.00;
	this.max_iterations = 50;
	this.repulsion_constant = 2.00;
	this.spring_constant = 1.0;
}

function NODE() {
	this.attraction = { x: 0, y: 0, z: 0 };
	this.highlighted = false;
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
		n.highlighted = this.highlighted;
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

	this.euclidean_distance_to_node = (node) => {
		const v = this.vector_to_node(node);
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

	this.add = (node) => {
		if (Array.isArray(node)) {
			this.cargo = this.cargo.concat(node);
			return;
		}
		if (node.cargo) {
			if (node.cargo.length) {
				for (let i = 0; i < node.cargo.length; i++) {
					this.add(node.cargo[i]);
				}
			}
			return;
		}
		this.cargo.push(node);
		return;
	}

	this.centroid = () => {
		const mean = { x: 0, y: 0, z: 0 }
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

	this.distribution_of_euclidean_distance_to_node = (node_u) => {
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

	this.distribution_of_edge_length = () => {
		const distribution = [];
		const coordinates = [];
		for (let u = 0; u < this.cargo.length; u++) {
			for (let v = 0; v < this.cargo.length; v++) {
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

	this.export_as_json = () => {
		return JSON.stringify(this.cargo);
	}

	this.force_directed_layout = (graph, options) => {
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
		options = options || new FD_OPTIONS();
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
						const distance = node_u.euclidean_distance_to_node(node_v) || 1.0;

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
						if (node_u.is_adjacent(node_v)) {
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
				const force_magnitude = Math.sqrt((layout[u].force.x * layout[u].force.x) + (layout[u].force.y * layout[u].force.y) + (layout[u].force.z * layout[u].force.z));
				if (force_magnitude > max_force) { max_force = force_magnitude; }

			} // done searching all u nodes

			// convert back to screen scale
			for (let i = 0; i < layout.length; i++) {
				layout[i].x += Math.round(layout[i].force.x * options.pixels_per_unit);
				layout[i].y += Math.round(layout[i].force.y * options.pixels_per_unit);
				layout[i].z += Math.round(layout[i].force.z * options.pixels_per_unit);
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

	this.filter_by = (parameter, filter) => {
		const new_graph = new GRAPH();
		if (!parameter || typeof (parameter) !== 'string') { return new_graph; }
		if (typeof (filter) === 'undefined') { return new_graph; }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				new_graph.add(this.filter_by(parameter, filter[i]));
			}
		}
		else {
			new_graph.cargo = this.cargo.filter((x) => {
				if (x[parameter]) { return x[parameter] === filter; }
				else { return false; }
			});
		}
		return new_graph.clone();
	}

	this.filter_by_id = (id) => { return this.filter_by('id', id); }

	this.filter_by_name = (name) => { return this.filter_by('name', name); }

	this.get_unique = (parameter) => {
		const arr = [];
		if (!parameter || typeof (parameter) !== 'string') { return arr; }
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i][parameter]) {
				arr.push(this.cargo[i][parameter]);
			}
		}
		return Array.from(new Set(arr));
	}

	this.highlight_nodes = (nodes) => {
		if (!nodes) { return; }
		if (nodes.cargo) { nodes = nodes.cargo; }
		const arr = [];
		for (let i = 0; i < nodes.length; i++) {
			arr.push(nodes[i].id);
		}
		const ids = Array.from(new Set(arr));
		for (let i = 0; i < this.cargo.length; i++) {
			if (ids.includes(this.cargo[i].id)) { this.cargo[i].highlighted = true; }
		}
	}

	this.includes = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return false; }
		if (typeof (filter) === 'undefined') { return false; }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				if (this.includes(parameter, filter[i])) { return true; }
			}
			return false;
		}
		else {
			const found = this.cargo.findIndex((x) => {
				if (x[parameter]) { return x[parameter] === filter; }
				else { return false; }
			});
			if (found >= 0) { return true; }
			return false;
		}
	}

	this.includes_all = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return false; }
		if (typeof (filter) === 'undefined') { return false; }
		if (Array.isArray(filter)) {
			let found = 0;
			for (let i = 0; i < filter.length; i++) {
				if (this.includes(parameter, filter[i])) { found++; }
			}
			if (found === filter.length) { return true; }
			return false;
		}
		else {
			const found = this.cargo.findIndex((x) => {
				if (x[parameter]) { return x[parameter] === filter; }
				else { return false; }
			});
			if (found >= 0) { return true; }
			return false;
		}
	}

	this.includes_all_ids = (ids) => { return this.includes_all('id', ids); }

	this.includes_all_indices = (indices) => { return this.includes_all('index', indices); }

	this.includes_all_names = (names) => { return this.includes_all('name', names); }

	this.includes_id = (id) => { return this.includes('id', id); }

	this.includes_index = (index) => { return this.includes('index', index); }

	this.includes_name = (name) => { return this.includes('name', name); }

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

	this.subgraph_between_nodes = (node_u, node_v, threshold) => {
		let subgraph = new GRAPH();
		if (!node_u || !node_v) { return subgraph; }
		if (node_u.id === node_v.id) { return subgraph; }
		threshold = threshold || 10000;
		let found = false;
		let level = 0;
		const hierarchy = [];
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
			previous_level = hierarchy[level];
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
		const arr = [];
		for (i = 0; i < hierarchy.length; i++) {
			for (let j = 0; j < hierarchy[i].length; j++) {
				arr.push(hierarchy[i][j]);
			}
		}
		const id_list = Array.from(new Set(arr));
		subgraph = this.filter_by_id(id_list);
		subgraph.update_indices();
		return subgraph;
	}

	this.sort_by_number_of_edges = () => {
		this.cargo.sort((a, b) => {
			if (a.edges.length > b.edges.length) { return -1; }
			if (a.edges.length < b.edges.length) { return 1; }
			return 0;
		});
		this.update_indices();
	}

	this.subgraph_from_index = (index, levels) => {
		let clone_list = [];
		const index_list = [];
		const graph = new GRAPH();
		if (typeof (index) === 'undefined') { return graph; }
		levels = levels || 0;
		index_list.push(index);
		let clone = this.cargo[index].clone();
		graph.add(clone);
		clone_list.push(clone);
		while (levels > 0) {
			const new_list = [];
			for (let i = 0; i < clone_list.length; i++) {
				for (let j = 0; j < clone_list[i].edges.length; j++) {
					const edge = clone_list[i].edges[j];
					if (!index_list.includes(edge.target_index)) {
						clone = this.cargo[edge.target_index].clone();
						index_list.push(edge.target_index);
						graph.add(clone);
						new_list.push(clone);
					}
				}
			}
			clone_list = new_list;
			levels = levels - 1;
		}
		graph.update_indices();
		return graph;
	}

	this.subgraph_from_nodes = (nodes) => {
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