///////////////////////////////////////////////////////////////////////////////
// hugo.js

const { IO } = require('../js/io.js');
const { PATHER } = require('../js/pather.js');
const io = new IO();
const pather = new PATHER();

function HUGO() {

	this.cargo = [];

	this.clear = () => { this.cargo = []; }

	this.clone = () => {
		const d = new DATA();
		d.cargo = this.clone_cargo();
		return d;
	}

	this.clone_cargo = () => {
		const c = [];
		for (let i = 0; i < this.cargo.length; i++) {
			const obj = JSON.parse(JSON.stringify(this.cargo[i]));
			c.push(obj);
		}
		return c;
	}

	this.delete_by = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				this.delete_by(parameter, filter[i]);
			}
		}
		else {
			for (let i = this.cargo.length - 1; i >= 0; i--) {
				if (this.cargo[i][parameter] && this.cargo[i][parameter] === filter) {
					this.cargo.splice(i, 1);
				}
			}
		}
	}

	this.export_as_json = () => {
		return JSON.stringify(this.cargo);
	}

	this.is_standardized = () => {
		const all_keys = this.get_unique_parameters();
		for (let i = 0; i < this.cargo.length; i++) {
			const keys = Object.keys(this.cargo[i]);
			if (keys.length !== all_keys.length) { return false; }
		}
		return true;
	}

	this.delete_by = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				this.delete_by(parameter, filter[i]);
			}
		}
		else {
			for (let i = this.cargo.length - 1; i >= 0; i--) {
				if (this.cargo[i][parameter] && this.cargo[i][parameter] === filter) {
					this.cargo.splice(i, 1);
				}
			}
		}
	}

	this.filter_by = (parameter, filter) => {
		const new_hugo = new HUGO();
		if (!parameter || typeof (parameter) !== 'string') { return new_hugo; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				new_hugo.add(this.filter_by(parameter, filter[i]));
			}
		}
		else {
			new_hugo.cargo = this.cargo.filter((x) => {
				if (x[parameter]) { return x[parameter] === filter; }
				else { return false; }
			});
		}
		return new_hugo.clone();
	}

	this.get_consensus = (parameter) => {
		if (!parameter || typeof (parameter) !== 'string') { return ''; }
		const v_list = this.get_unique(parameter);
		if (v_list.length === 1) { return v_list[0]; }
		const p_list = [];
		for (let i = 0; i < v_list.length; i++) {
			const quant = this.cargo.filter((v) => { return v[parameter] === v_list[i]; }).length;
			p_list.push({ parameter: v_list[i], quant: quant });
		}
		p_list.sort((a, b) => { return b.quant - a.quant; });
		if (p_list.length && p_list[0].parameter) { return p_list[0].parameter; }
		return '';
	}

	this.get_consensus_data_type = (parameter) => {
		if (!parameter || typeof (parameter) !== 'string') { return 'undefined'; }
		const v_list = this.get_unique_data_type(parameter);
		if (v_list.length === 1) { return v_list[0]; }
		const p_list = [];
		for (let i = 0; i < v_list.length; i++) {
			const quant = this.cargo.filter((v) => { return v[parameter] === v_list[i]; }).length;
			p_list.push({ parameter: v_list[i], quant: quant });
		}
		p_list.sort((a, b) => { return b.quant - a.quant; });
		if (p_list.length && p_list[0].parameter) { return p_list[0].parameter; }
		return 'undefined';
	}

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

	this.get_unique_data_type = (parameter) => {
		const arr = [];
		if (!parameter || typeof (parameter) !== 'string') { return arr; }
		for (let i = 0; i < this.cargo.length; i++) {
			const keys = Object.keys(this.cargo[i]);
			if (keys.includes(parameter)) {
				let type = typeof(this.cargo[i][parameter]);
				if (Array.isArray(this.cargo[i][parameter])) { type = 'array'; }
				arr.push(type);
			}
		}
		return Array.from(new Set(arr));
	}

	this.get_unique_parameters = () => {
		let all_keys = [];
		for (let i = 0; i < this.cargo.length; i++) {
			const keys = Object.keys(this.cargo[i]);
			all_keys = all_keys.concat(keys);
		}
		return Array.from(new Set(all_keys));
	}

	this.includes = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return false; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
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

	this.is_loaded = () => {
		if (this.cargo.length) { return true; }
		return false;
	}

	this.load = (data) => { this.cargo = data; }

	this.load_json_file = async (path) => {
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		const contents = await io.read_file(full_path);
		if (contents) { this.cargo = JSON.parse(contents).response.docs; }
		if (!this.is_standardized()) { this.standardize(); }
		return;
	}

	this.set = (parameter, value) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].set(parameter, value);
		}
	}

	this.set_to_consensus = (parameter) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		const value = this.get_consensus(parameter);
		this.set(parameter, value);
	}

	this.standardize = () => {
		const pt = [];
		const parameters = this.get_unique_parameters();
		for (let i = 0; i < parameters.length; i++) {
			pt.push({ parameter: parameters[i], type: '' });
		}
		for (let i = 0; i < pt.length; i++) {
			pt[i].type = this.get_consensus_data_type(pt.parameter).toLowerCase();
		}
		for (let i = 0; i < this.cargo.length; i++) {
			const keys = Object.keys(this.cargo[i]);
			for (let j = 0; j < pt.length; j++) {
				if (!keys.includes(pt[j].parameter)) {
					let d = '';
					switch (pt[j].type) {
						case 'array': { d = []; break; }
						case 'number': { d = 0; break; }
						case 'object': { d = {}; break; }
					}
					this.cargo[i][pt[j].parameter] = d;
				}
			}
		}
	}

	this.unload = () => {
		const new_cargo = this.cargo;
		this.clear();
		return new_cargo;
	}

}

module.exports = { HUGO: HUGO }