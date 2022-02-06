///////////////////////////////////////////////////////////////////////////////
// signalink.js

const { EDGE, NODE, GRAPH } = require('../js/graph.js');
const { DATA } = require('../js/data.js');
const data = new DATA();

function SIGNALINK() {

	this.cargo = [];
	this.path = '';

	this.clear = () => { this.cargo = []; }

	this.clone = () => {
		const c = new SIGNALINK();
		c.cargo = JSON.parse(JSON.stringify(this.cargo));
		c.path = this.path;
		return c;
	}

	this.export_as_graph = () => {
		// create an array of unique identifiers
		let directory = [];
		for (let i = 0; i < this.cargo.length; i++) {
			directory.push(this.cargo[i].source_uniprotAC);
			directory.push(this.cargo[i].target_uniprotAC);
		}
		directory = Array.from(new Set(directory));
		// create an array of NODE objects (one for each unique identifier)
		const graph = new GRAPH();
		for (let i = 0; i < directory.length; i++) {
			const node = new NODE();
			node.id = directory[i];
			node.index = i;
			// find all outgoing edges
			let records = this.cargo.filter((x) => { return x.source_uniprotAC === directory[i]; });
			if (records.length) {
				node.name = node.name || records[0].source_name;
				for (let j = 0; j < records.length; j++) {
					const target_index = directory.indexOf(records[j].target_uniprotAC); 
					if (target_index > -1) {
						const edge = new EDGE();
						edge.parent_id = directory[i];
						edge.target_id = records[j].target_uniprotAC;
						edge.parent_index = i;
						edge.target_index = target_index;
						edge.type = 'outgoing';
						node.edges.push(edge);
					}
				}
			}
			// find all incoming edges
			records = this.cargo.filter((x) => { return x.target_uniprotAC === directory[i]; });
			if (records.length) {
				node.name = node.name || records[0].target_name;
				for (let j = 0; j < records.length; j++) {
					const target_index = directory.indexOf(records[j].source_uniprotAC);
					if (target_index > -1) {
						const edge = new EDGE();
						edge.parent_id = directory[i];
						edge.target_id = records[j].source_uniprotAC;
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

	this.export_as_json = () => {
		return JSON.stringify(this.cargo);
	}

	this.load_xlsx_file = async (path) => {
		this.path = path;
		await data.load_xlsx_file(path);
		this.cargo = data.clone_cargo();
	}

}

///////////////////////////////////////////////////////////////////////////////

module.exports = { SIGNALINK: SIGNALINK }