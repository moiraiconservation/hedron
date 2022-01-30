///////////////////////////////////////////////////////////////////////////////
// graph.js

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
	
	this.draw = (highlight) => {

		if (highlight) {
			this.context.fillStyle = '#c90e8f';
			this.context.shadowBlur = this.radius * 3;
			this.context.shadowColor = '#c90e8f';
			this.context.strokeStyle = '#c90e8f';
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

	this.draw = (highlight) => {
		
		if (highlight) {
			this.context.shadowBlur = 2;
			this.context.shadowColor = '#c90e8f';
			this.context.strokeStyle = '#c90e8f';
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

		const nodes = JSON.parse(json);
		const pan = { start_x: 0, start_y: 0, state: false }
		const focused = { highlighted: false, key: -1, state: false }
		let is_mouse_down = false;
		const canvas = document.createElement('canvas');
		canvas.width = document.body.clientWidth;
		canvas.height = window_height;
		const context = canvas.getContext("2d");
		document.addEventListener('mousedown', get_mouse_button_state, false);
		document.addEventListener('mousemove', mouse_move, false);
		document.addEventListener('mouseup', get_mouse_button_state, false);
		document.addEventListener('wheel', mouse_zoom, false);

		// create the records
		const records = [];
		for (let i = 0; i < nodes.length; i++) {
			const record = new NETWORK_RECORD(context, nodes[i]);
			records.push(record);
		}
		update_all_lines();

		// draw the network
		console.log('Done!');
		draw_figure();

		///////////////////////////////////////////////////////////////////////////
		// METHODS ////////////////////////////////////////////////////////////////

		function draw_figure() {
			context.clearRect(0, 0, canvas.width, canvas.height);
			let highlight = false;
			for (let i = 0; i < records.length; i++) {
				if (focused.state && focused.key === i) { highlight = true; }
				else { highlight = false; }
				for (let j = 0; j < records[i].lines.length; j++) {
					records[i].lines[j].draw(highlight);
				}
			}
			for (let i = 0; i < records.length; i++) {
				if (focused.state && focused.key === i) { highlight = true; }
				else { highlight = false; }
				records[i].circle.draw(highlight);
			}
		}

		function get_mouse_button_state(e) {
			const t = e.type;
			if (t === "mousedown") {
				is_mouse_down = true;
			}
			else if (t === "mouseup") {
				is_mouse_down = false;
				focused.state = false;
				pan.state = false;
			}
		}

		function get_mouse_position(e) {
			const mouse_position = { x: 0, y: 0 };
			const rect = canvas.getBoundingClientRect();
			mouse_position.x = Math.round(e.x - rect.left);
			mouse_position.y = Math.round(e.y - rect.top);
			return mouse_position;
		}

		function is_mouse_over(circle, x, y) {
			const areaX = x - circle.x;
			const areaY = y - circle.y;
			return areaX * areaX + areaY * areaY <= circle.radius * circle.radius;
		}

		function mouse_move(e) {
			if (!is_mouse_down) { return; }
			const mouse_position = get_mouse_position(e);
			// if any circle is focused
			if (focused.state) {
				if (focused.key > 0 && !records[focused.key].node.locked) {
					records[focused.key].set_coordinates(mouse_position.x, mouse_position.y);
					update_all_lines();
					draw_figure();
				}
				return;
			}
			// no node is currently focused check if node is hovered
			for (let i = 0; i < records.length; i++) {
				if (records[i].circle.is_visible()) {
					if (is_mouse_over(records[i].circle, mouse_position.x, mouse_position.y)) {
						focused.key = i;
						focused.highlighted = true;
						focused.state = true;
						return;
					}
				}
			}
			// check to see if the viewport should be panned
			if (!pan.state) {
				pan.state = true;
				pan.start_x = mouse_position.x;
				pan.start_y = mouse_position.y;
			}
			if (pan.state) {
				const delta_x = mouse_position.x - pan.start_x;
				const delta_y = mouse_position.y - pan.start_y;
				for (let i = 0; i < records.length; i++) {
					records[i].offset_coordinates(delta_x, delta_y);
				}
				update_all_lines();
				draw_figure();
				pan.start_x = mouse_position.x;
				pan.start_y = mouse_position.y;
			}
		}

		function mouse_zoom(e) {
			const zoom = e.deltaY;
			const zoom_delta = 0.05;
			const zoom_in = 1.00 + zoom_delta;
			const zoom_out = 1.00 - zoom_delta;
			let scale = 1.00;
			if (zoom < 0) { scale = zoom_in; }
			else { scale = zoom_out; }
			const mouse_position = get_mouse_position(e);
			for (let i = 0; i < records.length; i++) {
				let delta_x = (records[i].circle.x - mouse_position.x) * scale;
				let delta_y = (records[i].circle.y - mouse_position.y) * scale;
				records[i].set_coordinates(mouse_position.x + delta_x, mouse_position.y + delta_y);
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
