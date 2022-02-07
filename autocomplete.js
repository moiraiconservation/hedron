///////////////////////////////////////////////////////////////////////////////
// autocomplete.js

function autocomplete(inp, arr) {

	let currentFocus = -1;

	inp.addEventListener('input', function (e) {
		var a, b, i, val = this.value;

		closeAllLists();
		if (!val) { return false; }
		a = document.createElement('div');
		a.id = 'autocomplete-list-' + this.id;
		a.classList.add('autocomplete-items');
		a.style.width = inp.offsetWidth + 'px';
		a.style.marginLeft = inp.style.marginLeft;
		this.parentNode.appendChild(a);

		for (i = 0; i < arr.length; i++) {

			if (arr[i] && typeof (arr[i]) === 'string' && arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {

				b = document.createElement('div');
				b.innerHTML = '<strong>' + arr[i].substr(0, val.length) + '</strong>';
				b.innerHTML += arr[i].substr(val.length);
				b.innerHTML += '<input type="hidden" value="' + arr[i] + '">';

				b.addEventListener('click', function () {
					inp.value = this.getElementsByTagName('input')[0].value;
					inp.focus();
					closeAllLists();
				});

				a.appendChild(b);

			}
		}

		if (a.innerHTML == '') { a.style.display = 'none'; }
		else { a.style.display = 'block'; }

	});

	inp.addEventListener('keydown', function (e) {
		var x = document.getElementById('autocomplete-list-' + this.id);
		if (x) { x = x.getElementsByTagName('div'); }
		if (e.key === 'ArrowDown') {
			currentFocus++;
			addActive(x);
		}
		else if (e.key === 'ArrowUp') {
			currentFocus--;
			addActive(x);
		}
		else if ((e.key === 'Enter') || (e.key === 'Tab')) {
			if (currentFocus > -1) {
				if (x) { x[currentFocus].click(); }
			}
			else {
				if (e.target.parentNode.childNodes) {
					if (e.target.parentNode.childNodes[1]) {
						if (e.target.parentNode.childNodes[1].childNodes) {
							if (e.target.parentNode.childNodes[1].childNodes[0]) {
								inp.value = e.target.parentNode.childNodes[1].childNodes[0].textContent;
								closeAllLists();
							}
						}
					}
				}
			}
		}
	});
	
	function addActive(x) {
		if (!x) { return false; }
		removeActive(x);
		if (currentFocus >= x.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (x.length - 1);
		x[currentFocus].classList.add('autocomplete-active');
	}
	
	function closeAllLists(elmnt) {
		var x = document.getElementsByClassName('autocomplete-items');
		for (var i = 0; i < x.length; i++) {
			if (elmnt != x[i] && elmnt != inp) {
				x[i].parentNode.removeChild(x[i]);
			}
		}
	}

	function removeActive(x) {
		for (var i = 0; i < x.length; i++) {
			x[i].classList.remove('autocomplete-active');
		}
	}

	document.addEventListener('click', function (e) { closeAllLists(e.target); });

}
