///////////////////////////////////////////////////////////////////////////////
// drugbank.js

const { DB } = require('../js/db.js');

class DRUGBANK {

	constructor() {
		this.target_polypeptides = new DB();
		this.vocabulary = new DB();
	}

	clear() {
		this.target_polypeptides.clear();
		this.vocabulary.clear();
	}

	clone() {
		const d = new DRUGBANK();
		d.target_polypeptides = this.target_polypeptides.clone();
		d.vocabulary = this.vocabulary.clone();
		return d;
	}

	get_drugbank_id_by_drug_name(drug_name) {
		drug_name = drug_name.toLowerCase();
		let drugbank_id = '';
		const common_name = this.vocabulary.filter_by('common_name', drug_name);
		const synonyms = this.vocabulary.filter_by('synonyms', drug_name);
		if (common_name.cargo.length) { drugbank_id = common_name.cargo[0].drugbank_id; }
		else if (synonyms.cargo.length) { drugbank_id = synonyms.cargo[0].drugbank_id; }
		return drugbank_id;
	}

	get_drugbank_ids_by_gene_name(gene_name) {
		let drugbank_ids = [];
		const targets = this.target_polypeptides.filter_by('gene_name', gene_name);
		if (targets.cargo.length) {
			for (let i = 0; i < targets.cargo.length; i++) {
				if (targets.cargo[i].drug_ids) {
					if (Array.isArray(targets.cargo[i].drug_ids)) {
						drugbank_ids = drugbank_ids.concat(targets.cargo[i].drug_ids);
					}
					else {
						drugbank_ids.push(targets.cargo[i].drug_ids);
					}
				}
			}
		}
		return Array.from(new Set(drugbank_ids));
	}

	get_uniprot_ids_by_drug_name(drug_name) {
		let uniprot_ids = [];
		const drugbank_id = this.get_drugbank_id_by_drug_name(drug_name);
		if (drugbank_id) {
			const subset = this.filter_by_drugbank_id(drugbank_id);
			if (subset.target_polypeptides.is_loaded()) {
				uniprot_ids = subset.target_polypeptides.get_unique('uniprot_id');
			}
		}
		return uniprot_ids;
	}

	get_unique_drug_names() {
		const common_names = this.vocabulary.get_unique('common_name');
		const synonyms = this.vocabulary.get_unique('synonyms');
		const arr = common_names.concat(synonyms);
		const names = Array.from(new Set(arr));
		names.sort((a, b) => {
			if (a < b) { return -1; }
			if (a > b) { return 1; }
			return 0;
		});
		return names;
	}

	get_unique_gene_names = () => {
		const gene_names = this.target_polypeptides.get_unique('gene_name');
		const names = Array.from(new Set(gene_names));
		names.sort((a, b) => {
			if (a < b) { return -1; }
			if (a > b) { return 1; }
			return 0;
		});
		return names;
	}

	filter_by_drugbank_id(drugbank_id) {
		const db = new DRUGBANK();
		db.target_polypeptides.add(this.target_polypeptides.filter_by('drug_ids', drugbank_id));
		return db;
	}

	async load_xlsx_target_polypeptides_file(path) {
		await this.target_polypeptides.load_xlsx_file(path);
		for (let i = 0; i < this.target_polypeptides.cargo.length; i++) {
			if (this.target_polypeptides.cargo[i].drug_ids && typeof (this.target_polypeptides.cargo[i].drug_ids) === 'string') {
				this.target_polypeptides.cargo[i].drug_ids = this.target_polypeptides.cargo[i].drug_ids.split('; ');
			}
			else { this.target_polypeptides.cargo[i].drug_ids = []; }
			if (this.target_polypeptides.cargo[i].genbank_protein_id && typeof (this.target_polypeptides.cargo[i].genbank_protein_id) === 'number') {
				this.target_polypeptides.cargo[i].genbank_protein_id = this.target_polypeptides.cargo[i].genbank_protein_id.toString();
			}
			if (this.target_polypeptides.cargo[i].pdb_id && typeof (this.target_polypeptides.cargo[i].pdb_id) === 'string') {
				this.target_polypeptides.cargo[i].pdb_id = this.target_polypeptides.cargo[i].pdb_id.split('; ');
			}
			else { this.target_polypeptides.cargo[i].pdb_id = []; }
		}
	}

	async load_xlsx_vocabulary_file(path) {
		await this.vocabulary.load_xlsx_file(path);
		for (let i = 0; i < this.vocabulary.cargo.length; i++) {
			if (this.vocabulary.cargo[i].accession_numbers && typeof (this.vocabulary.cargo[i].accession_numbers) === 'string') {
				this.vocabulary.cargo[i].accession_numbers = this.vocabulary.cargo[i].accession_numbers.split(' | ');
			}
			else { this.vocabulary.cargo[i].accession_numbers = []; }
			if (this.vocabulary.cargo[i].synonyms && typeof (this.vocabulary.cargo[i].synonyms) === 'string') {
				this.vocabulary.cargo[i].synonyms = this.vocabulary.cargo[i].synonyms.split(' | ');
				// remove entries with non-Latin characters
				for (let j = this.vocabulary.cargo[i].synonyms.length - 1; j >= 0; j--) {
					this.vocabulary.cargo[i].synonyms[j] = this.vocabulary.cargo[i].synonyms[j].normalize('NFD');
					if (this.vocabulary.cargo[i].synonyms[j].match(/[\u0300-\u036f]/) !== null) {
						this.vocabulary.cargo[i].synonyms.splice(j, 1);
					}
				}
			}
			else { this.vocabulary.cargo[i].synonyms = []; }
		}

	}

}

module.exports = { DRUGBANK: DRUGBANK }