///////////////////////////////////////////////////////////////////////////////
// autocomplete.js

function autocomplete(inp, arr) {
	// the autocomplete function takes two arguments,
	// the text field element and an array of possible autocompleted values
	var currentFocus;
	// execute a function when someone writes in the text field
	inp.addEventListener("input", function (e) {
		var a, b, i, val = this.value;
		// close any already open lists of autocompleted values
		closeAllLists();
		if (!val) { return false; }
		currentFocus = -1;
		// create a DIV element that will contain the items (values)
		a = document.createElement("div");
		a.id = "autocomplete-list-" + this.id;
		a.classList.add("autocomplete-items");
		a.style.width = inp.offsetWidth + "px";
		// append the DIV element as a child of the autocomplete container
		this.parentNode.appendChild(a);
		// for each item in the array...
		for (i = 0; i < arr.length; i++) {
			// check if the item starts with the same letters as the text field value:
			if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
				// create a DIV element for each matching element:
				b = document.createElement("DIV");
				// make the matching letters bold:
				b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
				b.innerHTML += arr[i].substr(val.length);
				// insert a input field that will hold the current array item's value
				b.innerHTML += '<input type="hidden" value="' + arr[i] + '">';
				// execute a function when someone clicks on the item value (DIV element)
				b.addEventListener("click", function (e) {
					// insert the value for the autocomplete text field:
					inp.value = this.getElementsByTagName("input")[0].value;
					inp.focus();
					// close the list of autocompleted values,
					// (or any other open lists of autocompleted values:
					closeAllLists();
				}); // end event listener
				a.appendChild(b);
			} // end if
		} // end for loop
		if (a.innerHTML == '') { a.style.display = "none"; }
		else { a.style.display = "block"; }
	}); // end event listener
	// execute a function when someone presses a key on the keyboard
	inp.addEventListener("keydown", function (e) {
		var x = document.getElementById("autocomplete-list-" + this.id);
		if (x) { x = x.getElementsByTagName("div"); }
		if (e.key === "ArrowDown") {
			// if the arrow DOWN key is pressed,
			// increase the currentFocus variable
			currentFocus++;
			// and make the current item more visible
			addActive(x);
		} // end if
		else if (e.key === "ArrowUp") {
			// if the arrow UP key is pressed,
			// decrease the currentFocus variable
			currentFocus--;
			// and make the current item more visible
			addActive(x);
		} // end else if
		else if ((e.key === "Enter") || (e.key === "Tab")) {
			// if the TAB key (9) or ENTER key (13) is pressed
			if (currentFocus > -1) {
				// and simulate a click on the "active" item
				if (x) { x[currentFocus].click(); }
			} // end if
			else {
				if (e.target.parentNode.childNodes) {
					if (e.target.parentNode.childNodes[1]) {
						if (e.target.parentNode.childNodes[1].childNodes) {
							if (e.target.parentNode.childNodes[1].childNodes[0]) {
								inp.value = e.target.parentNode.childNodes[1].childNodes[0].textContent;
								closeAllLists();
							} // end if (e.target.parentNode.childNodes[1].childNodes[0])
						} // end if (e.target.parentNode.childNodes[1].childNodes)
					} // end if (e.target.parentNode.childNodes[1])
				} // end if (e.target.parentNode.childNodes)
			} // end else
		} // end else if
	}); // end event listener
	function addActive(x) {
		// a function to classify an item as "active"
		if (!x) { return false; }
		// start by removing the "active" class on all items
		removeActive(x);
		if (currentFocus >= x.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (x.length - 1);
		// add class "autocomplete-active"
		x[currentFocus].classList.add("autocomplete-active");
	} // end function
	function removeActive(x) {
		// a function to remove the "active" class from all autocomplete items
		for (var i = 0; i < x.length; i++) {
			x[i].classList.remove("autocomplete-active");
		} // end for loop
	} // end function
	function closeAllLists(elmnt) {
		// close all autocomplete lists in the document,
		// except the one passed as an argument
		var x = document.getElementsByClassName("autocomplete-items");
		for (var i = 0; i < x.length; i++) {
			if (elmnt != x[i] && elmnt != inp) {
				x[i].parentNode.removeChild(x[i]);
			} // end if
		} // end for loop
	} // end function
	//execute a function when someone clicks in the document
	document.addEventListener("click", function (e) { closeAllLists(e.target); });
} // end function
