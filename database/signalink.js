///////////////////////////////////////////////////////////////////////////////
// signalink.js

const { EDGE, NODE, GRAPH } = require('../js/graph.js');
const { DATA } = require('../js/data.js');
const data = new DATA();

function SIGNALINK() {

	this.cargo = [];

	this.clear = () => { this.cargo = []; }

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
			// find all outgoing edges
			let records = this.cargo.filter((x) => { return x.source_uniprotAC === directory[i]; });
			if (records.length) {
				node.name = records[0].source_name;
				for (let j = 0; j < records.length; j++) {
					const edge = new EDGE();
					edge.index = directory.indexOf(records[j].target_uniprotAC);
					edge.id = records[j].target_uniprotAC;
					edge.type = 'outgoing';
					node.edges.push(edge);
				}
			}
			// find all incoming edges
			records = this.cargo.filter((x) => { return x.target_uniprotAC === directory[i]; });
			if (records.length) {
				for (let j = 0; j < records.length; j++) {
					const edge = new EDGE();
					edge.index = directory.indexOf(records[j].source_uniprotAC);
					edge.id = records[j].source_uniprotAC;
					edge.type = 'incoming';
					node.edges.push(edge);
				}
			}
			graph.add(node);
		}
		return graph;
	}

	this.load_xlsx_file = async (path) => {
		await data.load_xlsx_file(path);
		this.cargo = data.clone_cargo();
	}

}

module.exports = { SIGNALINK: SIGNALINK }