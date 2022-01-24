///////////////////////////////////////////////////////////////////////////////
// figure.js

function CIRCLE(context, x, y, r, fill, stroke) {

	x = x || Math.floor(Math.random() * 10000) - 5000;
	y = y || Math.floor(Math.random() * 10000) - 5000;
	r = r || 10;
	fill = fill || '#' + Math.floor(Math.random() * 16777215).toString(16);
	stroke = stroke || fill;

	this.context = context;
	this.startingAngle = 0;
	this.endAngle = 2 * Math.PI;
	this.x = x;
	this.y = y;
	this.r = r;
	this.fill = fill;
	this.stroke = stroke;

	this.is_visible = () => {
		const width = this.context.canvas.width;
		const height = this.context.canvas.height;
		if (this.x < (0 - this.r)) { return false; }
		if (this.x > (width + r)) { return false; }
		if (this.y < (0 - this.r)) { return false; }
		if (this.y > (height + this.r)) { return false; }
		return true;
	}
	
	this.draw = () => {
		this.context.beginPath();
		this.context.arc(this.x, this.y, this.r, this.startingAngle, this.endAngle);
		this.context.fillStyle = this.fill;
		this.context.lineWidth = 3;
		this.context.fill();
		this.context.strokeStyle = this.stroke;
		this.context.stroke();
	}

}

function LINE(context, x0, y0, x1, y1, stroke, thickness) {

	x0 = x0 || Math.floor(Math.random() * 10000) - 5000;
	y0 = y0 || Math.floor(Math.random() * 10000) - 5000;
	x1 = x1 || x0 + Math.floor(Math.random() * 100) - 50;
	y1 = y1 || y0 + Math.floor(Math.random() * 100) - 50;
	stroke = stroke || '#' + Math.floor(Math.random() * 16777215).toString(16);
	thickness = thickness || 2;

	this.context = context;
	this.x0 = x0;
	this.y0 = y0;
	this.x1 = x1;
	this.y1 = y1;
	this.stroke = stroke;
	this.thickness = thickness;

	this.is_visible = () => {
		const width = this.context.canvas.width;
		const height = this.context.canvas.height;
		if (this.x0 < 0 && this.x1 < 0) { return false; }
		if (this.x0 > width && this.x1 > width) { return false; }
		if (this.y0 < 0 && this.y1 < 0) { return false; }
		if (this.y0 > height && this.y1 > height) { return false; }
		return true;
	}

	this.draw = () => {
		this.context.beginPath();
		this.context.strokeStyle = this.stroke;
		this.context.lineWidth = this.thickness;
		this.context.moveTo(this.x0, this.y0);
		this.context.lineTo(this.x1, this.y1);
		this.context.closePath();
		this.context.stroke();
	}

}

function NETWORK_RECORD(context, node) {
	this.context = context;
	this.node = node || new NODE();
	this.circle = new CIRCLE(this.context);
	this.lines = [];
	if (this.node.targets) {
		for (let i = 0; i < this.node.targets.length; i++) {
			const line = new LINE(this.context, this.circle.x, this.circle.y);
			this.lines.push(line);
		}
	}

	this.draw = () => {
		if (this.circle.is_visible()) {
			for (let i = 0; i < this.lines.length; i++) { this.lines[i].draw(); }
			this.circle.draw();
		}
	}

}

function NODE() {
	this.id = '';
	this.name = '';
	this.targets = [];
}

function NODE_TARGET() {
	this.id = '';
	this.index = 0;
}

///////////////////////////////////////////////////////////////////////////////

function FIGURE() {

	// TO-DO:
	//	(5)	Add a method to the NETWORK object that adjusts
	//			the x and y parameters of CIRCLE and LINE
	//			objects based on the network topology.  This should
	//			be an initialization method for constructing the
	//			starting network figure layout.
	//	(6) Update the intersects function in this.network
	//			so it looks less like it came directly from
	//			StackOverflow.

	this.network = (nodes) => {

		const records = [];
		const pan = { start_x: 0, start_y: 0, state: false }
		const focused = { key: 0, state: false }
		let is_mouse_down = false;

		const canvas = document.createElement('canvas');
		canvas.width = document.body.clientWidth;
		canvas.height = window_height - 200;
		const context = canvas.getContext("2d");

		document.addEventListener('mousemove', mouse_move, false);
		document.addEventListener('mousedown', setDraggable, false);
		document.addEventListener('mouseup', setDraggable, false);
		document.addEventListener('wheel', mouse_zoom, false);

		// create the records
		for (let i = 0; i < nodes.length; i++) {
			const record = new NETWORK_RECORD(context, nodes[i]);
			records.push(record);
		}
		for (let i = 0; i < records.length; i++) {
			update_target_lines(i);
		}

		// main draw method
		function draw_figure() {
			context.clearRect(0, 0, canvas.width, canvas.height);
			for (let i = 0; i < records.length; i++) { records[i].draw(); }
		}

		function mouse_move(e) {
			if (!is_mouse_down) { return; }
			const mouse_position = get_mouse_position(e);
			//if any circle is focused
			if (focused.state) {
				records[focused.key].circle.x = mouse_position.x;
				records[focused.key].circle.y = mouse_position.y;
				update_target_lines(focused.key);
				draw_figure();
				return;
			}
			//no circle currently focused check if circle is hovered
			for (let i = 0; i < records.length; i++) {
				if (records[i].circle.is_visible()) {
					if (intersects(records[i].circle, mouse_position.x, mouse_position.y)) {
						focused.key = i;
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
					records[i].circle.x += delta_x;
					records[i].circle.y += delta_y;
					update_target_lines(i);
				}
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
				records[i].circle.x = mouse_position.x + delta_x;
				records[i].circle.y = mouse_position.y + delta_y;
				records[i].circle.r *= scale;
				update_target_lines(i);
			}
			draw_figure();
		}

		//set mousedown state
		function setDraggable(e) {
			const t = e.type;
			if (t === "mousedown") { is_mouse_down = true; }
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

		//detects whether the mouse cursor is between x and y relative to the radius specified
		function intersects(circle, x, y) {
			// subtract the x, y coordinates from the mouse position to get coordinates 
			// for the hotspot location and check against the area of the radius
			const areaX = x - circle.x;
			const areaY = y - circle.y;
			//return true if x^2 + y^2 <= radius squared.
			return areaX * areaX + areaY * areaY <= circle.r * circle.r;
		}

		function update_target_lines(index) {
			const x0 = records[index].circle.x;
			const y0 = records[index].circle.y;
			for (let i = 0; i < records[index].node.targets.length; i++) {
				const target = records[index].node.targets[i];
				const target_index = target.index;
				const x1 = records[target_index].circle.x;
				const y1 = records[target_index].circle.y;
				records[index].lines[i].x0 = x0;
				records[index].lines[i].y0 = y0;
				records[index].lines[i].x1 = x1;
				records[index].lines[i].y1 = y1;
			}
		}

		draw_figure();
		return canvas;

	}

}
