///////////////////////////////////////////////////////////////////////////////
// graph.js

function EDGE() {
	this.id = '';
	this.index = 0;
	this.type = '';
	this.weight;

	this.clone = () => {
		const e = new EDGE();
		e.id = this.id;
		e.index = this.index;
		e.type = this.type;
		e.weight = this.weight;
		return e;
	}

}

function NODE() {
	this.id = '';
	this.name = '';
	this.edges = [];
	this.force = { x: 0, y: 0 }
	this.radius = 1;
	this.type = '';
	this.x = Math.floor(Math.random() * 10000) - 5000;
	this.y = Math.floor(Math.random() * 10000) - 5000;

	this.clone = () => {
		const n = new NODE();
		n.id = this.id;
		n.name = this.name;
		for (let i = 0; i < this.edges.length; i++) {
			const e = this.edges[i].clone();
			n.edges.push(e);
		}
		n.force.x = this.force.x;
		n.force.y = this.force.y;
		n.radius = this.radius;
		n.type = this.type;
		n.x = this.x;
		n.y = this.y;
		return n;
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

}

module.exports = { EDGE: EDGE, NODE: NODE, GRAPH: GRAPH }