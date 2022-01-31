///////////////////////////////////////////////////////////////////////////////
// figure.js

///////////////////////////////////////////////////////////////////////////////
// PART 1: CANVAS ELEMENTS ////////////////////////////////////////////////////

function CIRCLE(context, x, y, radius, fill, stroke) {

	x = x || Math.floor(Math.random() * 100000) - 50000;
	y = y || Math.floor(Math.random() * 100000) - 50000;
	radius = radius || 10;
	fill = fill || '#7ebbed';
	stroke = stroke || 'rgb(0, 0, 0, 0)';

	this.context = context;
	this.startingAngle = 0;
	this.endAngle = 2 * Math.PI;
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.fill = fill;
	this.shadowBlur = radius * 2;
	this.shadowColor = 'white';
	this.stroke = stroke;

	this.is_visible = () => {
		const width = this.context.canvas.width;
		const height = this.context.canvas.height;
		if (this.x < (0 - this.radius)) { return false; }
		if (this.x > (width + this.radius)) { return false; }
		if (this.y < (0 - this.radius)) { return false; }
		if (this.y > (height + this.radius)) { return false; }
		return true;
	}
	
	this.draw = (color) => {

		if (color) {
			this.context.fillStyle = color;
			this.context.shadowBlur = this.radius * 3;
			this.context.shadowColor = color;
			this.context.strokeStyle = color;
		}
		else {
			this.context.fillStyle = this.fill;
			this.context.shadowBlur = this.shadowBlur;
			this.context.shadowColor = this.shadowColor;
			this.context.strokeStyle = this.stroke;
		}
		this.context.lineWidth = 3;
		this.context.beginPath();
		this.context.arc(this.x, this.y, this.radius, this.startingAngle, this.endAngle);
		this.context.fill();
		this.context.stroke();
	}

}

function LINE(context, x0, y0, x1, y1, stroke, thickness) {

	x0 = x0 || Math.floor(Math.random() * 10000) - 5000;
	y0 = y0 || Math.floor(Math.random() * 10000) - 5000;
	x1 = x1 || x0 + Math.floor(Math.random() * 100) - 50;
	y1 = y1 || y0 + Math.floor(Math.random() * 100) - 50;
	stroke = stroke || 'rgb(49.4, 73.3, 92.9, 0.5)';
	thickness = thickness || 2;

	this.context = context;
	this.x0 = x0;
	this.y0 = y0;
	this.x1 = x1;
	this.y1 = y1;
	this.shadowBlur = 0;
	this.shadowColor = 'transparent';
	this.stroke = stroke;
	this.thickness = thickness;

	this.is_visible = () => {
		const width = this.context.canvas.width;
		const height = this.context.canvas.height;
		if ((this.x0 >= 0 && this.x0 <= width) && (this.y0 >= 0 && this.y0 <= height)) { return true; }
		if ((this.x1 >= 0 && this.x1 <= width) && (this.y1 >= 0 && this.y1 <= height)) { return true; }
		return false;
	}

	this.draw = (color) => {
		
		if (color) {
			this.context.shadowBlur = 2;
			this.context.shadowColor = color;
			this.context.strokeStyle = color;
		}
		else {
			this.context.shadowBlur = this.shadowBlur;
			this.context.shadowColor = this.shadowColor;
			this.context.strokeStyle = this.stroke;
		}
		this.context.lineWidth = this.thickness;
		this.context.beginPath();
		this.context.moveTo(this.x0, this.y0);
		this.context.lineTo(this.x1, this.y1);
		this.context.stroke();
	}

}

function MOUSE(canvas) {

	this.canvas = canvas || undefined;
	this.left_button_is_down = false;
	this.right_button_is_down = false;
	this.x = 0;
	this.y = 0;

	document.addEventListener('mousedown', get_mouse_button_state.bind(this), false);
	document.addEventListener('mousemove', get_mouse_movement.bind(this), false);
	document.addEventListener('mouseup', get_mouse_button_state.bind(this), false);

	this.over_canvas = () => {
		if (canvas) {
			const rect = canvas.getBoundingClientRect();
			if (this.x >= rect.left && this.x <= rect.right) {
				if (this.y >= rect.top && this.y <= rect.bottom) { return true; }
			}
		}
		return false;
	}

	function get_mouse_button_state(e) {
		switch (e.type) {
			case 'mousedown': {
				if (e.button === 0) { this.left_button_is_down = true; }
				if (e.button === 2) { this.right_button_is_down = true; }
				break;
			}
			case 'mouseup': {
				if (e.button === 0) { this.left_button_is_down = false; }
				if (e.button === 2) { this.right_button_is_down = false; }
				break;
			}
		}
		return;
	}

	function get_mouse_movement(e) {
		this.x = e.x;
		this.y = e.y;
		if (canvas) {
			const rect = canvas.getBoundingClientRect();
			this.x = Math.round(e.x - rect.left);
			this.y = Math.round(e.y - rect.top);
		}
	}

}

///////////////////////////////////////////////////////////////////////////////
// PART 2: DATA STRUCTURES ////////////////////////////////////////////////////

function NETWORK_RECORD(context, node) {
	this.context = context;
	this.circle = new CIRCLE(this.context, node.x, node.y, node.radius);
	this.lines = [];
	this.node = node; // this element is expected to be a NODE object from graph.js
	if (this.node.edges) {
		for (let i = 0; i < this.node.edges.length; i++) {
			const line = new LINE(this.context, this.circle.x, this.circle.y);
			this.lines.push(line);
		}
	}

	this.display_name = () => {
		let alpha = (this.circle.radius - 10) / 15;
		alpha = Math.min(Math.max(alpha, 0.0), 1.0).toFixed(2);
		const font_size = Math.floor(this.circle.radius * 1.33).toString();
		this.context.font = 'bold ' + font_size + 'px Calibri';
		this.context.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
		this.context.shadowBlur = 10;
		this.context.shadowColor = 'rgba(0, 0, 0, ' + alpha + ')';
		this.context.textAlign = 'center';
		this.context.textBaseline = 'middle';
		this.context.fillText(this.node.name, this.circle.x, this.circle.y);
	}

	this.offset_coordinates = (x, y) => {
		x = x || 0;
		y = y || 0;
		this.node.x += x;
		this.node.y += y;
		this.circle.x += x;
		this.circle.y += y;
	}

	this.scale_coordinates = (scale) => {
		scale = scale || 1.0;
		this.node.x *= scale;
		this.node.y *= scale;
		this.circle.x *= scale;
		this.circle.y *= scale;
	}

	this.set_coordinates = (x, y) => {
		x = x || 0;
		y = y || 0;
		this.node.x = x;
		this.node.y = y;
		this.circle.x = x;
		this.circle.y = y;
	}

}

///////////////////////////////////////////////////////////////////////////////
// PART 3: THE FIGURE OBJECT //////////////////////////////////////////////////

function FIGURE() {

	this.network_diagram = (json) => {

		const drag = { index: -1, state: false }
		const highlight = { index: -1, state: false }
		const nodes = JSON.parse(json);
		const pan = { start_x: 0, start_y: 0, state: false, x: 0, y: 0 }
		const records = [];
		let targets = [];
		
		const canvas = document.createElement('canvas');
		canvas.width = document.body.clientWidth;
		canvas.height = window_height;
		const context = canvas.getContext("2d");
		const mouse = new MOUSE(canvas);

		document.addEventListener('mousedown', mouse_button, false);
		document.addEventListener('mousemove', mouse_move, false);
		document.addEventListener('mouseup', mouse_button, false);
		document.addEventListener('wheel', mouse_zoom, false);

		// create the records
		for (let i = 0; i < nodes.length; i++) {
			const record = new NETWORK_RECORD(context, nodes[i]);
			records.push(record);
		}
		update_all_lines();
		draw_figure();

		///////////////////////////////////////////////////////////////////////////
		// METHODS ////////////////////////////////////////////////////////////////

		function draw_figure() {
			context.clearRect(0, 0, canvas.width, canvas.height);
			let color = '';
			for (let i = 0; i < records.length; i++) {
				if (highlight.state && highlight.index === i) { color = '#c90e8f'; } else { color = ''; }
				for (let j = 0; j < records[i].lines.length; j++) { records[i].lines[j].draw(color); }
			}
			for (let i = 0; i < records.length; i++) {
				if (targets.includes(i)) { color = '#ff89ef' }
				else if (highlight.state && highlight.index === i) { color = '#c90e8f'; } else { color = ''; }
				records[i].circle.draw(color);
				records[i].display_name();
			}
		}

		function is_mouse_over(circle) {
			const delta_x = mouse.x - circle.x;
			const delta_y = mouse.y - circle.y;
			return (delta_x * delta_x) + (delta_y * delta_y) <= (circle.radius * circle.radius);
		}

		function mouse_button(e) {
			if (!mouse.over_canvas()) { return; }
			switch (e.type) {
				case 'mousedown': {
					// check to see if the mouse if over a circle
					for (let i = 0; i < records.length; i++) {
						if (records[i].circle.is_visible()) {
							if (is_mouse_over(records[i].circle)) {
								drag.index = i;
								drag.state = true;
								highlight.index = i;
								highlight.state = true;
								pan.index = -1;
								pan.state = false;
								targets = [];
								for (let j = 0; j < records[i].node.edges.length; j++) {
									targets.push(records[i].node.edges[j].target_index);
								}
								draw_figure();
								return;
							}
						}
					}
					// the mouse is not over a circle
					if (!pan.state) {
						pan.state = true;
						pan.start_x = mouse.x;
						pan.start_y = mouse.y;
						pan.x = mouse.x;
						pan.y = mouse.y;
					}
					break;
				}
				case 'mouseup': {
					if (drag.state) { drag.index = -1; drag.state = false; }
					if (highlight.index === -1) { highlight.state = false; }
					if (pan.state) {
						pan.state = false;
						// check to see if the canvas was only clicked, and not dragged
						const delta_x = mouse.x - pan.start_x;
						const delta_y = mouse.y - pan.start_y;
						if (delta_x + delta_y === 0) {
							highlight.index = -1;
							highlight.state = false;
							targets = [];
						}
					}
					draw_figure();
					break;
				}
			}
			return;
		}

		function mouse_move() {
			// Check to see that the mouse is over the canvas and
			//	the left mouse button is down
			if (!mouse.over_canvas()) { return; }
			if (!mouse.left_button_is_down) {	return; }

			// The left mouse button is down.
			// check to see if any circle should be dragged
			if (drag.state) {
				if (drag.index > -1 && !records[drag.index].node.locked) {
					records[drag.index].set_coordinates(mouse.x, mouse.y);
					update_all_lines();
					draw_figure();
				}
				return;
			}
			// No circle is currently being dragged.
			// Check to see if the viewport should be panned
			if (pan.state) {
				const delta_x = mouse.x - pan.x;
				const delta_y = mouse.y - pan.y;
				for (let i = 0; i < records.length; i++) {
					records[i].offset_coordinates(delta_x, delta_y);
				}
				update_all_lines();
				draw_figure();
				pan.x = mouse.x;
				pan.y = mouse.y;
			}
		}

		function mouse_zoom(e) {
			if (!mouse.over_canvas()) { return; }
			const zoom = e.deltaY;
			const zoom_delta = 0.05;
			const zoom_in = 1.00 + zoom_delta;
			const zoom_out = 1.00 - zoom_delta;
			let scale = 1.00;
			if (zoom < 0) { scale = zoom_in; }
			else { scale = zoom_out; }
			for (let i = 0; i < records.length; i++) {
				let delta_x = (records[i].circle.x - mouse.x) * scale;
				let delta_y = (records[i].circle.y - mouse.y) * scale;
				records[i].set_coordinates(mouse.x + delta_x, mouse.y + delta_y);
				records[i].circle.radius *= scale;
			}
			update_all_lines();
			draw_figure();
		}

		function update_all_lines() {
			for (let i = 0; i < records.length; i++) {
				update_lines(i);
			}
		}

		function update_lines(parent_index) {
			const record = records[parent_index];
			const x0 = record.node.x;
			const y0 = record.node.y;
			for (let p = 0; p < record.node.edges.length; p++) {
				const target_index = record.node.edges[p].target_index;
				const target_record = records[target_index];
				const x1 = target_record.node.x;
				const y1 = target_record.node.y;
				records[parent_index].lines[p].x0 = x0;
				records[parent_index].lines[p].y0 = y0;
				records[parent_index].lines[p].x1 = x1;
				records[parent_index].lines[p].y1 = y1;
				const target_array = target_record.node.edges.filter((x) => { return x.target_id === record.node.id; });
				for (let t = 0; t < target_array.length; t++) {
					records[target_index].lines[t].x0 = x1;
					records[target_index].lines[t].y0 = y1;
					records[target_index].lines[t].x1 = x0;
					records[target_index].lines[t].y1 = y0;
				}
			}
		}

		draw_figure();
		return canvas;

	}

}
