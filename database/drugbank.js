///////////////////////////////////////////////////////////////////////////////
// drugbank.js

const { EDGE, NODE, GRAPH } = require('../js/graph.js');
const { DATA } = require('../js/data.js');
const data = new DATA();

function DRUGBANK() {

	this.cargo = [];
	this.path = { target_polypeptides: '', vocabulary: '' };
	this.vocabulary = [];

	this.clear = () => { this.cargo = []; }

	this.clone = () => {
		const c = new DRUGBANK();
		c.cargo = JSON.parse(JSON.stringify(this.cargo));
		c.vocabulary = JSON.parse(JSON.stringify(this.vocabulary));
		c.path.target_polypeptides = this.path.target_polypeptides;
		c.path.vocabulary = this.path.vocabulary;
		return c;
	}

	this.export_as_json = () => {
		return JSON.stringify(this.cargo);
	}

	this.export_vocabulary_as_json = () => {
		return JSON.stringify(this.vocabulary);
	}

	this.filter_by = (parameter, filter) => {
		const new_drugbank = new DRUGBANK();
		new_drugbank.path.target_polypeptides = this.path.target_polypeptides;
		new_drugbank.path.vocabulary = this.path.vocabulary;
		if (!parameter || typeof (parameter) !== 'string') { return new_drugbank; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				const db = this.filter_by(parameter, filter[i]);
				for (let j = 0; j < db.cargo.length; j++) { new_drugbank.cargo.push(db.cargo[j]); }
				for (let j = 0; j < db.vocabulary.length; j++) { new_drugbank.vocabulary.push(db.vocabulary[j]); }
			}
		}
		else {
			new_drugbank.cargo = this.cargo.filter((x) => {
				if (x[parameter]) {
					if (Array.isArray(x[parameter])) {
						return x[parameter].includes(filter);
					}
					else { return x[parameter] === filter; }
				}
				else { return false; }
			});
			new_drugbank.vocabulary = this.vocabulary.filter((x) => {
				if (x[parameter]) {
					if (Array.isArray(x[parameter])) {
						return x[parameter].includes(filter);
					}
					else { return x[parameter] === filter; }
				}
				else { return false; }
			});
		}
		return new_drugbank.clone();
	}

	this.get_drugbank_id_by_name = (name) => {
		name = name.toLowerCase();
		let drugbank_id = '';
		const common_name = this.filter_by('common_name', name);
		const synonyms = this.filter_by('synonyms', name);
		if (common_name.vocabulary.length) { drugbank_id = common_name.vocabulary[0].drugbank_id; }
		else if (synonyms.vocabulary.length) { drugbank_id = synonyms.vocabulary[0].drugbank_id; }
		return drugbank_id;
	}

	this.get_genes_by_drugbank_id = (drugbank_id) => {
		return this.filter_by('drug_ids', drugbank_id);
	}

	this.get_unique = (parameter) => {
		const arr = [];
		if (!parameter || typeof (parameter) !== 'string') { return arr; }
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i][parameter]) {
				if (Array.isArray(this.cargo[i][parameter])) {
					for (let j = 0; j < this.cargo[i][parameter].length; j++) {
						arr.push(this.cargo[i][parameter][j]);
					}
				}
				else { arr.push(this.cargo[i][parameter]); }
			}
		}
		for (let i = 0; i < this.vocabulary.length; i++) {
			if (this.vocabulary[i][parameter]) {
				if (Array.isArray(this.vocabulary[i][parameter])) {
					for (let j = 0; j < this.vocabulary[i][parameter].length; j++) {
						arr.push(this.vocabulary[i][parameter][j]);
					}
				}
				else { arr.push(this.vocabulary[i][parameter]); }
			}
		}
		return Array.from(new Set(arr));
	}

	this.get_unique_drug_names = () => {
		const common_names = this.get_unique('common_name');
		const synonyms = this.get_unique('synonyms');
		const arr = common_names.concat(synonyms);
		const names = Array.from(new Set(arr));
		names.sort((a, b) => {
			if (a < b) { return -1; }
			if (a > b) { return 1; }
			return 0;
		});
		return names;
	}

	this.get_unique_gene_names = () => {
		const gene_names = this.get_unique('gene_name');
		const names = Array.from(new Set(gene_names));
		names.sort((a, b) => {
			if (a < b) { return -1; }
			if (a > b) { return 1; }
			return 0;
		});
		return names;
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
			const found_cargo = this.cargo.findIndex((x) => {
				if (x[parameter]) {
					if (Array.isArray(x[parameter])) {
						return x[parameter].includes(filter);
					}
					else { return x[parameter] === filter; }
				}
				else { return false; }
			});
			const found_vocabulary = this.vocabulary.findIndex((x) => {
				if (x[parameter]) {
					if (Array.isArray(x[parameter])) {
						return x[parameter].includes(filter);
					}
					else { return x[parameter] === filter; }
				}
				else { return false; }
			});
			if (found_cargo >= 0 || found_vocabulary >= 0) { return true; }
			return false;
		}
	}

	this.load_xlsx_target_polypeptides_file = async (path) => {
		this.path.target_polypeptides = path;
		await data.load_xlsx_file(path);
		this.cargo = data.clone_cargo();
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i].drug_ids && typeof (this.cargo[i].drug_ids) === 'string') {
				this.cargo[i].drug_ids = this.cargo[i].drug_ids.split('; ');
			}
			else { this.cargo[i].drug_ids = []; }
			if (this.cargo[i].genbank_protein_id && typeof (this.cargo[i].genbank_protein_id) === 'number') {
				this.cargo[i].genbank_protein_id = this.cargo[i].genbank_protein_id.toString();
			}
			if (this.cargo[i].pdb_id && typeof(this.cargo[i].pdb_id) === 'string') {
				this.cargo[i].pdb_id = this.cargo[i].pdb_id.split('; ');
			}
			else { this.cargo[i].pdb_id = []; }
		}
	}

	this.load_xlsx_vocabulary_file = async (path) => {
		this.path.vocabulary = path;
		await data.load_xlsx_file(path);
		this.vocabulary = data.clone_cargo();
		for (let i = 0; i < this.vocabulary.length; i++) {
			if (this.vocabulary[i].accession_numbers && typeof (this.vocabulary[i].accession_numbers) === 'string') {
				this.vocabulary[i].accession_numbers = this.vocabulary[i].accession_numbers.split(' | ');
			}
			else { this.vocabulary[i].accession_numbers = []; }
			if (this.vocabulary[i].common_name && typeof (this.vocabulary[i].common_name) === 'string') { this.vocabulary[i].common_name = this.vocabulary[i].common_name.toLowerCase(); }
			if (this.vocabulary[i].synonyms && typeof (this.vocabulary[i].synonyms) === 'string') {
				this.vocabulary[i].synonyms = this.vocabulary[i].synonyms.split(' | ');
				// remove entries with non-Latin characters
				for (let j = this.vocabulary[i].synonyms.length - 1; j >= 0; j--) {
					this.vocabulary[i].synonyms[j] = this.vocabulary[i].synonyms[j].normalize('NFD');
					this.vocabulary[i].synonyms[j] = this.vocabulary[i].synonyms[j].toLowerCase();
					if (this.vocabulary[i].synonyms[j].match(/[\u0300-\u036f]/) !== null) {
						this.vocabulary[i].synonyms.splice(j, 1);
					}
				}
			}
			else { this.vocabulary[i].synonyms = []; }
		}
	}

}

///////////////////////////////////////////////////////////////////////////////

module.exports = { DRUGBANK: DRUGBANK }