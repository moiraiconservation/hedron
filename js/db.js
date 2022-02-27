///////////////////////////////////////////////////////////////////////////////
// db.js

const { DATA } = require('./data.js');
const { IO } = require('./io.js');
const { PATHER } = require('./pather.js');

class DB {

	constructor() {
		this.cargo = [];
		this.path = '';
	}

	// private methods

	#assign_from_string(parameter, value, obj) {
		let parent = obj;
		const keys = parameter.split('.');
		for (let i = 0; i < keys.length - 1; i++) {
			if (typeof (parent) !== 'undefined') {
				if (i < keys.length - 1) {
					const { [keys[i]]: returned_value } = parent;
					parent = returned_value;
				}
			}
		}
		parent[keys[keys.length - 1]] = value;
	}

	#destructure_from_string(parameter, obj) {
		let parent = obj;
		const keys = parameter.split('.');
		for (let i = 0; i < keys.length; i++) {
			if (typeof (parent) !== 'undefined') {
				const { [keys[i]]: returned_value } = parent;
				parent = returned_value;
			}
		}
		return parent;
	}

	// public methods

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

	clone(return_class) {
		const d = return_class || new DB();
		d.cargo = this.clone_cargo();
		d.path = this.path;
		return d;
	}

	clone_cargo() {
		const c = [];
		for (let i = 0; i < this.cargo.length; i++) {
			if (typeof (this.cargo[i].clone) !== 'undefined' && typeof (this.cargo[i].clone) === 'function') {
				c.push(this.cargo[i].clone());
			}
			else { c.push(JSON.parse(JSON.stringify(this.cargo[i]))); }
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
				const element = this.#destructure_from_string(parameter, this.cargo[i]);
				if (typeof (element) !== 'undefined') {
					if (Array.isArray(element)) {
						const index = element.findIndex((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') { return y.toLowerCase() === filter.toLowerCase(); }
							else { return y === filter; }
						});
						if (index > -1) { this.cargo.splice(i, 1); }
					}
					else if (typeof (element) === 'string' && typeof (filter) === 'string') {
						if (element.toLowerCase() === filter.toLocaleLowerCase()) { this.cargo.splice(i, 1); }
					}
					else if (element === filter) { this.cargo.splice(i, 1); }
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
				const element = this.#destructure_from_string(parameter, this.cargo[i]);
				if (typeof (element) !== 'undefined') {
					if (Array.isArray(element)) {
						const index = element.findIndex((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') { return y.toLowerCase() === filter.toLowerCase(); }
							else { return y === filter; }
						});
						if (index > -1) { matched = true; }
					}
					else if (typeof (element) === 'string' && typeof (filter) === 'string') {
						if (element.toLowerCase() === filter.toLocaleLowerCase()) { matched = true; }
					}
					else if (element === filter) { matched = true; }
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

	filter_by(parameter, filter, return_class) {
		const db = return_class || new DB();
		if (!parameter || typeof (parameter) !== 'string') { return db; }
		if (typeof (filter) === 'undefined') { return db; }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				db.add(this.filter_by(parameter, filter[i]));
			}
		}
		else {
			db.cargo = this.cargo.filter((x) => {
				const element = this.#destructure_from_string(parameter, x);
				if (typeof (element) !== 'undefined') {
					if (Array.isArray(element)) {
						const arr = element.filter((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') {
								return y.toLowerCase() === filter.toLowerCase();
							}
							else { return y === filter; }
						});
						return arr.length > 0;
					}
					else if (typeof (element) === 'string' && typeof (filter) === 'string') {
						return element.toLowerCase() === filter.toLowerCase();
					}
					else { return element === filter; }
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
			const quant = this.filter_by(parameter, v_list[i]).length;
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
			const quant = this.filter_by(parameter, v_list[i]).length;
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
			const element = this.#destructure_from_string(parameter, this.cargo[i]);
			if (typeof (element) !== 'undefined') {
				if (Array.isArray(element)) { arr = arr.concat(element); }
				else { arr.push(element); }
			}
		}
		return Array.from(new Set(arr));
	}

	get_unique_data_type(parameter) {
		const arr = [];
		if (!parameter || typeof (parameter) !== 'string') { return arr; }
		for (let i = 0; i < this.cargo.length; i++) {
			const element = this.#destructure_from_string(parameter, this.cargo[i]);
			let type = typeof (element);
			if (Array.isArray(element)) { type = 'array'; }
			arr.push(type);
		}
		return Array.from(new Set(arr));
	}

	get_unique_parameters(parameter) {
		let all_keys = [];
		if (typeof (parameter) === 'undefined') {
			for (let i = 0; i < this.cargo.length; i++) {
				const keys = Object.keys(this.cargo[i]);
				all_keys = all_keys.concat(keys);
			}
			return Array.from(new Set(all_keys));
		}
		else {
			for (let i = 0; i < this.cargo.length; i++) {
				const element = this.#destructure_from_string(parameter, this.cargo[i]);
				const keys = Object.keys(element);
				all_keys = all_keys.concat(keys);
			}
			return Array.from(new Set(all_keys));
		}
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
				const element = this.#destructure_from_string(parameter, x);
				if (typeof (element) !== 'undefined') {
					if (Array.isArray(element)) {
						const arr = element.filter((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') {
								return y.toLowerCase() === filter.toLowerCase();
							}
							else { return y === filter; }
						});
						return arr.length > 0;			
					}
					else if (typeof (element) === 'string' && typeof (filter) === 'string') {
						return element.toLowerCase() === filter.toLowerCase();
					}
					else { return element === filter; }
				}
				else { return false; }
			});
			if (found >= 0) { return true; }
			return false;
		}
	}

	includes_all(parameter, filter) {
		if (!parameter || typeof (parameter) !== 'string') { return false; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			let found = 0;
			for (let i = 0; i < filter.length; i++) {
				if (this.includes(parameter, filter[i])) { found++; }
			}
			if (found === filter.length) { return true; }
			return false;
		}
		else { return this.includes(parameter, filter); }
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
			this.#assign_from_string(parameter, value, this.cargo[i]);
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
				let element = this.#destructure_from_string(parameter2, this.cargo[i]);
				if (typeof (element) !== 'undefined') {

					if (Array.isArray(element)) {
						const index = element.findIndex((y) => {
							if (typeof (y) === 'string' && typeof (filter) === 'string') { return y.toLowerCase() === filter.toLowerCase(); }
							else { return y === filter; }
						});
						if (index > -1) { this.#assign_from_string(parameter1, value, this.cargo[i]); }
					}
					else if (typeof (element) === 'string' && typeof (filter) === 'string') {
						if (element.toLowerCase() === filter.toLocaleLowerCase()) { this.#assign_from_string(parameter1, value, this.cargo[i]); }
					}
					else if (element === filter) { this.#assign_from_string(parameter1, value, this.cargo[i]); }
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

module.exports = { DB: DB }