///////////////////////////////////////////////////////////////////////////////
// signalink.js

const { DB } = require('../js/db.js');
const { EDGE, NODE, GRAPH } = require('../js/graph.js');

class SIGNALINK extends DB {

	constructor() { super(); }

	clone() {
		const d = new SIGNALINK();
		d.cargo = JSON.parse(JSON.stringify(this.cargo));
		d.path = this.path;
		return d;
	}

	export_as_graph() {
		// create an array of unique identifiers
		let directory = [];
		for (let i = 0; i < this.cargo.length; i++) {
			directory.push(this.cargo[i].source_uniprotac);
			directory.push(this.cargo[i].target_uniprotac);
		}
		directory = Array.from(new Set(directory));
		// create an array of NODE objects (one for each unique identifier)
		const graph = new GRAPH();
		for (let i = 0; i < directory.length; i++) {
			const node = new NODE();
			node.id = directory[i];
			node.index = i;
			// find all outgoing edges
			let records = this.cargo.filter((x) => { return x.source_uniprotac === directory[i]; });
			if (records.length) {
				node.name = node.name || records[0].source_name;
				for (let j = 0; j < records.length; j++) {
					const target_index = directory.indexOf(records[j].target_uniprotac);
					if (target_index > -1) {
						const edge = new EDGE();
						edge.parent_id = directory[i];
						edge.target_id = records[j].target_uniprotac;
						edge.parent_index = i;
						edge.target_index = target_index;
						edge.type = 'outgoing';
						node.edges.push(edge);
					}
				}
			}
			// find all incoming edges
			records = this.cargo.filter((x) => { return x.target_uniprotac === directory[i]; });
			if (records.length) {
				node.name = node.name || records[0].target_name;
				for (let j = 0; j < records.length; j++) {
					const target_index = directory.indexOf(records[j].source_uniprotac);
					if (target_index > -1) {
						const edge = new EDGE();
						edge.parent_id = directory[i];
						edge.target_id = records[j].source_uniprotac;
						edge.parent_index = i;
						edge.target_index = target_index;
						edge.type = 'incoming';
						node.edges.push(edge);
					}
				}
			}
			graph.add(node);
		}
		graph.make_2d();
		return graph;
	}

}

module.exports = { SIGNALINK: SIGNALINK }