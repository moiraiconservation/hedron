///////////////////////////////////////////////////////////////////////////////
// db.js

const { DATA } = require('../js/data.js');
const { IO } = require('../js/io.js');
const { PATHER } = require('../js/pather.js');

module.exports = class DB {

	constructor() {
		this.cargo = [];
		this.path = '';
	}

	add(records) {
		if (Array.isArray(records)) {
			for (let i = 0; i < records.length; i++) {
				this.add(records[i]);
			}
		}
		else {
			if (records.cargo) {
				for (let i = 0; i < records.cargo.length; i++) {
					this.cargo.push(records.cargo[i]);
				}
			}
			else { this.cargo.push(records); }
		}
	}

	clear() {
		this.cargo = [];
		this.path = '';
	}

	clone() {
		const d = new DB();
		d.cargo = this.clone_cargo();
		d.path = this.path;
		return d;
	}

	clone_cargo() {
		const c = [];
		for (let i = 0; i < this.cargo.length; i++) {
			const obj = JSON.parse(JSON.stringify(this.cargo[i]));
			c.push(obj);
		}
		return c;
	}

	delete_by(parameter, filter) {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				this.delete_by(parameter, filter[i]);
			}
		}
		else {
			for (let i = this.cargo.length - 1; i >= 0; i--) {
				if (this.cargo[i][parameter]) {
					if (Array.isArray(this.cargo[i][parameter])) {
						const index = this.cargo[i][parameter].findIndex((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') { return y.toLowerCase() === filter.toLowerCase(); }
							else { return y === filter; }
						});
						if (index > -1) { this.cargo.splice(i, 1); }
					}
					else if (typeof (this.cargo[i][parameter]) === 'string' && typeof (filter) === 'string') {
						if (this.cargo[i][parameter].toLowerCase() === filter.toLocaleLowerCase()) { this.cargo.splice(i, 1); }
					}
					else if (this.cargo[i][parameter] === filter) { this.cargo.splice(i, 1); }
				} 
			}
		}
	}

	delete_duplicates_by(parameter, filter) {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				this.delete_duplicates_by(parameter, filter[i]);
			}
		}
		else {
			let count = 0;
			for (let i = this.cargo.length - 1; i >= 0; i--) {
				let matched = false;
				if (this.cargo[i][parameter]) {
					if (Array.isArray(this.cargo[i][parameter])) {
						const index = this.cargo[i][parameter].findIndex((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') { return y.toLowerCase() === filter.toLowerCase(); }
							else { return y === filter; }
						});
						if (index > -1) { matched = true; }
					}
					else if (typeof (this.cargo[i][parameter]) === 'string' && typeof (filter) === 'string') {
						if (this.cargo[i][parameter].toLowerCase() === filter.toLocaleLowerCase()) { matched = true; }
					}
					else if (this.cargo[i][parameter] === filter) { matched = true; }
					if (matched) {
						count++;
						if (count > 1) { this.cargo.splice(i, 1); }
					}
				}
			}
		}
	}

	export_as_json() {
		return JSON.stringify(this.cargo);
	}

	is_standardized() {
		const all_keys = this.get_unique_parameters();
		for (let i = 0; i < this.cargo.length; i++) {
			const keys = Object.keys(this.cargo[i]);
			if (keys.length !== all_keys.length) { return false; }
		}
		return true;
	}

	filter_by(parameter, filter) {
		const db = new DB();
		if (!parameter || typeof (parameter) !== 'string') { return db; }
		if (typeof (filter) === 'undefined') { return db; }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				db.add(this.filter_by(parameter, filter[i]));
			}
		}
		else {
			db.cargo = this.cargo.filter((x) => {
				if (x[parameter]) {
					if (Array.isArray(x[parameter])) {
						const arr = x[parameter].filter((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') {
								return y.toLowerCase() === filter.toLowerCase();
							}
							else { return y === filter; }
						});
						return arr.length > 0;
					}
					else if (typeof (x[parameter]) === 'string' && typeof (filter) === 'string') {
						return x[parameter].toLowerCase() === filter.toLowerCase();
					}
					else { return x[parameter] === filter; }
				}
				else { return false; }
			});
		}
		return db.clone();
	}

	get_consensus(parameter) {
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

	get_consensus_data_type(parameter) {
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

	get_unique(parameter) {
		let arr = [];
		if (!parameter || typeof (parameter) !== 'string') { return arr; }
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i][parameter]) {
				if (Array.isArray(this.cargo[i][parameter])) { arr = arr.concat(this.cargo[i][parameter]); }
				else { arr.push(this.cargo[i][parameter]); }
			}
		}
		return Array.from(new Set(arr));
	}

	get_unique_data_type(parameter) {
		const arr = [];
		if (!parameter || typeof (parameter) !== 'string') { return arr; }
		for (let i = 0; i < this.cargo.length; i++) {
			const keys = Object.keys(this.cargo[i]);
			if (keys.includes(parameter)) {
				let type = typeof (this.cargo[i][parameter]);
				if (Array.isArray(this.cargo[i][parameter])) { type = 'array'; }
				arr.push(type);
			}
		}
		return Array.from(new Set(arr));
	}

	get_unique_parameters() {
		let all_keys = [];
		for (let i = 0; i < this.cargo.length; i++) {
			const keys = Object.keys(this.cargo[i]);
			all_keys = all_keys.concat(keys);
		}
		return Array.from(new Set(all_keys));
	}

	highlight_all() { this.set('highlight', true); }

	highlight_by(parameter, filter) { this.set_by('highlight', true, parameter, filter); }

	includes(parameter, filter) {
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
				if (x[parameter]) {
					if (Array.isArray(x[parameter])) {
						const arr = x[parameter].filter((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') {
								return y.toLowerCase() === filter.toLowerCase();
							}
							else { return y === filter; }
						});
						return arr.length > 0;			
					}
					else if (typeof (x[parameter]) === 'string' && typeof (filter) === 'string') {
						return x[parameter].toLowerCase() === filter.toLowerCase();
					}
					else { return x[parameter] === filter; }
				}
				else { return false; }
			});
			if (found >= 0) { return true; }
			return false;
		}
	}

	is_loaded() {
		if (this.cargo.length) { return true; }
		return false;
	}

	load(data) { this.cargo = data; }

	async load_json_file(path) {
		const io = new IO();
		const pather = new PATHER();
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		const contents = await io.read_file(full_path);
		if (contents) { this.cargo = JSON.parse(contents).response.docs; }
		if (!this.is_standardized()) { this.standardize(); }
		this.path = full_path;
		return;
	}

	async load_xlsx_file(path) {
		const data = new DATA();
		const pather = new PATHER();
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		await data.load_xlsx_file(full_path);
		this.cargo = data.clone_cargo();
		if (!this.is_standardized()) { this.standardize(); }
		this.path = full_path;
	}

	lock_all() { this.set('locked', true); }

	lock_by(parameter, filter) { this.set_by('locked', true, parameter, filter); }

	set(parameter, value) {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i][parameter] = value;
		}
	}

	set_by(parameter1, value, parameter2, filter) {
		if (!parameter1 || typeof (parameter1) !== 'string') { return; }
		if (!parameter2 || typeof (parameter2) !== 'string') { return; }
		if (typeof (filter) === 'undefined') { return; }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				this.set_by(parameter1, value, parameter2, filter[i]);
			}
		}
		else {
			for (let i = 0; i < this.cargo.length; i++) {
				if (this.cargo[i][parameter2]) {
					if (Array.isArray(this.cargo[i][parameter2])) {
						const index = this.cargo[i][parameter2].findIndex((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') { return y.toLowerCase() === filter.toLowerCase(); }
							else { return y === filter; }
						});
						if (index > -1) { this.cargo[i][parameter1] = value; }
					}
					else if (typeof (this.cargo[i][parameter2]) === 'string' && typeof (filter) === 'string') {
						if (this.cargo[i][parameter2].toLowerCase() === filter.toLocaleLowerCase()) { this.cargo[i][parameter1] = value; }
					}
					else if (this.cargo[i][parameter2] === filter) { this.cargo[i][parameter1] = value; }
				}
			}
		}
	}

	set_to_consensus(parameter) {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		const value = this.get_consensus(parameter);
		this.set(parameter, value);
	}

	standardize() {
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
			// add custom hedron fields
			if (!this.cargo[i].highlight) { this.cargo[i].highlight = false; }
			if (!this.cargo[i].locked) { this.cargo[i].locked = false; }
		}
	}

	unload() {
		const new_cargo = this.cargo;
		this.clear();
		return new_cargo;
	}

	unhighlight_all() { this.set('highlight', false);	}

	unhighlight_by(parameter, filter) { this.set_by('highlight', false, parameter, filter); }

	unlock_all() { this.set('locked', false); }

	unlock_by(parameter, filter) { this.set_by('locked', false, parameter, filter); }

}