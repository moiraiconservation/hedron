///////////////////////////////////////////////////////////////////////////////
//stats.js

function STATS() {

	this.cargo = [];
	this.sample = false;

  this.load = (data) => {
    this.cargo = JSON.parse(JSON.stringify(data));
    this.sort();
		for (let i = this.cargo.length - 1; i >= 0; i--) {
			if (typeof (this.cargo[i]) !== 'number') { this.cargo.splice(i, 1); }
		}
  }

	this.clear = () => {
    this.cargo = [];
  }

	this.clone = () => {
		const s = new STATS();
		s.cargo = JSON.parse(JSON.stringify(this.cargo));
		s.sample = this.sample;
		return s;
	}

	this.sort = () => {
    this.cargo.sort(function(a, b) {
      if (a < b) { return -1; }
      if (a > b) { return  1; }
      return 0;
    });
  }

  ////////////////////////////////////////////////////////////////////////
  // DESCRIPTIVE STATISTICS //////////////////////////////////////////////

	this.box_plot_outliers = () => {
		// returns distribution elements that fail the box-plot outlier test
		const q = this.quartiles();
		const median = q.q2;
		const iqr = q.iqr;
		const upper = median + (1.5 * iqr);
		const lower = median - (1.5 * iqr);
		const o = [];
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i] > upper || this.cargo[i] < lower) {
				o.push(this.cargo[i]);
			}
		}
		return o;
	}

	this.central_moment = (moment) => {
		if (!this.cargo.length) { return undefined; }
		if (!moment) { moment = 2; }
		if (this.cargo.length < 2) { return undefined; }
		let mean = this.mean();
		let centralMoment = 0;
		for (let i = 0; i < this.cargo.length; i++) {
			centralMoment += Math.pow((this.cargo[i] - mean), moment);
		}
		return centralMoment;
	};

	this.kurtosis = function () {
		if (!this.cargo.length) { return undefined; }
		if (this.cargo.length < 4) { return undefined; }
		let kurtosis = 3;
		let n = this.cargo.length;
		let stdev = this.stdev();
		let skew = this.skew();
		if (this.sample) {
			let moment4 = this.centralMoment(d, 4);
			kurtosis = moment4 / Math.pow(stdev, 4);
			kurtosis = kurtosis * ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)));
			kurtosis = kurtosis - ((3 * Math.pow((n - 1), 2)) / ((n - 2) * (n - 3)));
		}
		else {
			let moment2 = this.centralMoment(d, 2);
			let moment4 = this.centralMoment(d, 4);
			kurtosis = moment4 / Math.pow(moment2, 2);
			kurtosis = kurtosis * n;
			kurtosis = kurtosis - 3;
		}
		let excess_kurtosis = kurtosis - 3;
		let standard_error = Math.sqrt((Math.pow(n, 2) - 1) / ((n - 3) * (n + 5)));
		standard_error = standard_error * 2 * skew.standard_error;
		let obj = {};
		obj.kurtosis = kurtosis;
		obj.excess_kurtosis = excess_kurtosis;
		obj.standard_error = standard_error;
		obj.z_score = kurtosis / standard_error;
		obj.significant = false;
		if (kurtosis == 3) { obj.category = 'mesokurtic'; }
		if (kurtosis > 3) { obj.category = 'leptokurtic'; }
		if (kurtosis < 3) { obj.category = 'platykurtic'; }
		if ((n < 50) && (obj.z_score > 1.96)) { obj.significant = true; }
		if ((n >= 50) && (n < 300) && (obj.z_score > 3.29)) { obj.significant = true; }
		if ((n >= 300) && (Math.abs(obj.kurtosis) > 7.00)) { obj.significant = true; }
		obj.description = 'The degree of kurtosis is ';
		if (obj.significant) { obj.description += 'significant and the distribution is ' + obj.category + '.'; }
		else { obj.description += 'not significant.'; }
		return obj;
	}

	this.max = function(d) {
		if (!this.cargo.length) { return undefined; }
		let data = this.sort(d);
		return data[data.length - 1];
	}

	this.mean = () => {
		if (!this.cargo.length) { return undefined; }
		let mean = 0;
    for (let i = 0; i < this.cargo.length; i++) {
      mean += this.cargo[i];
    }
    mean = mean / this.cargo.length;
    return mean;
  }

  this.median = () => {
		if (!this.cargo.length) { return undefined; }
    this.sort();
    let median = 0;
    if (this.cargo.length % 2 == 0) {
      let index = this.cargo.length / 2;
      median = (this.cargo[index - 1] + this.cargo[index]) / 2;
    }
    else {
      let index = Math.ceil(this.cargo.length / 2) - 1;
      median = this.cargo[index];
    }
    return median;
  }

	this.min = () => {
		if (!this.cargo.length) { return undefined; }
		this.sort();
		return this.cargo[0];
	}

	this.mode = () => {
		if (!this.cargo.length) { return undefined; }
		let list = [];
    let primary_mode = 0;
    let maxValue = 0;
    let mode = [];
    this.cargo.forEach(function(currentValue) {
    	if (typeof(list[currentValue]) == "undefined") { list[currentValue] = 1; }
    	else { list[currentValue] = list[currentValue] + 1 ; }
    });
    list.forEach(function(currentValue, index, arr) {
      if (currentValue > maxValue) { maxValue = currentValue; primary_mode = index; }
    });
    mode.push(primary_mode);
    list.forEach(function(currentValue, index, arr) {
      if ((list[index] == list[primary_mode]) && (index != primary_mode)) { mode.push(index); }
    });
    return mode;
  };

	this.n = () => { return thia.cargo.length; }

	this.quartiles = () => {
		if (!this.cargo.length) { return undefined; }
    this.sort();
    let index1 = 0;
    let index2 = 0;
    let quartile = { };
    if (this.cargo.length < 4) { return quartile; }
    if (this.cargo.length % 2 == 0) {
      index1 = this.cargo.length / 2;
      index2 = index1;
    }
    else {
      index1 = Math.ceil(this.cargo.length / 2) - 1;
      index2 = index1 + 2;
    }
		const d1 = this.clone();
		const d3 = this.clone();
		d1.cargo = d1.cargo.slice(0, index1);
		d3.cargo = d3.cargo.slice(index2, this.cargo.length);
    quartile.q1 = d1.median() || 0;
    quartile.q2 = this.median() || 0;
    quartile.q3 = d3.median() || 0;
    quartile.iqr = Math.abs(quartile.q3 - quartile.q1) || 0;
    return quartile;
  };

	this.sem = () => {
		if (!this.cargo.length) { return undefined; }
		if (this.cargo.length < 4) { return undefined; }
		let n = this.cargo.length;
		let stdev = this.stdev();
		let sem = n / Math.sqrt(stdev);
		return sem;
	};

	this.skew = () => {
		if (!this.cargo.length) { return undefined; }
		if (this.cargo.length < 4) { return undefined; }
		let stdev = this.stdev();
		let n = this.cargo.length;
		let mean = this.mean();
		let moment = 0;
		let skew = 0;
		for (let i = 0; i < this.cargo.length; i++) {
			moment += Math.pow(((this.cargo[i] - mean) / stdev), 3);
		}
		if (this.sample) { skew = moment * (n / ((n - 1) * (n - 2))); }
		else { skew = moment / n; }
		let standard_error = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
		let obj = {};
		obj.skew = skew;
		obj.standard_error = standard_error;
		obj.direction = 'symmetric';
		obj.z_score = skew / standard_error;
		obj.significant = false;
		if (skew < 0) { obj.direction = 'left'; }
		if (skew > 0) { obj.direction = 'right'; }
		if ((n < 50) && (obj.z_score > 1.96)) { obj.significant = true; }
		if ((n >= 50) && (n < 300) && (obj.z_score > 3.29)) { obj.significant = true; }
		if ((n >= 300) && (Math.abs(obj.skew) > 2.00)) { obj.significant = true; }
		obj.description = 'The degree of skewness is ';
		if (obj.significant) { obj.description += 'significant to the ' + obj.direction + '.'; }
		else { obj.description += 'not significant.'; }
		return obj;
	};

	this.variance = () => {
		if (!this.cargo.length) { return undefined; }
		if (this.cargo.length < 4) { return undefined; }
		let centralMoment = this.centralMoment(2);
		let variance = 0;
		if (this.sample) { variance = centralMoment / (this.cargo.length - 1); }
		else { variance = centralMoment / this.cargo.length; }
		return variance;
	};

	this.stdev = () => {
		if (!this.cargo.length) { return undefined; }
		if (this.cargo.length < 4) { return undefined; }
    let variance = this.variance();
    let stdev = Math.sqrt(variance);
    return stdev;
  };

	////////////////////////////////////////////////////////////////////////
  // ROBUST DESCRIPTIVE STATISTICS ///////////////////////////////////////

	this.mad = () => {
		if (!this.cargo.length) { return undefined; }
    let n = this.cargo.length;
    let median = this.median();
    let distribution = [];
    for (let i = 0; i < n; i++) {
        distribution.push(Math.abs(this.cargo[i] - median));
    }
    let mad = this.median(distribution);
    if (!d && this.this.cargo) { this.value.mad = mad; }
    return mad;
  }

}

///////////////////////////////////////////////////////////////////////////////

module.exports = { STATS: STATS }