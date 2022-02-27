///////////////////////////////////////////////////////////////////////////////
// random.js

function RANDOM() {

	this.guid = () => {
		function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
		return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
	}

	this.random_int_from_interval = (min, max) => {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

}

module.exports = { RANDOM: RANDOM }