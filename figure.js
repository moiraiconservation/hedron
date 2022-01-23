///////////////////////////////////////////////////////////////////////////////
// figure.js

function FIGURE() {

	function CIRCLE(context, x, y, r, fill, stroke) {
		this.startingAngle = 0;
		this.endAngle = 2 * Math.PI;
		this.x = x;
		this.y = y;
		this.r = r;
		this.fill = fill;
		this.stroke = stroke;

		this.draw = () => {
			context.beginPath();
			context.arc(this.x, this.y, this.r, this.startingAngle, this.endAngle);
			context.fillStyle = this.fill;
			context.lineWidth = 3;
			context.fill();
			context.strokeStyle = this.stroke;
			context.stroke();
		}

		this.is_visible = () => {
			const width = context.canvas.width;
			const height = context.canvas.height;
			if (this.x < (0 - this.r)) { return false; }
			if (this.x > (width + r)) { return false; }
			if (this.y < (0 - this.r)) { return false; }
			if (this.y > (height + this.r)) { return false; }
			return true;
		}
	}

	this.network = (nodes) => {

		const circles = [];
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

		//make some circles
		for (let i = 0; i < nodes.length; i++) {
			const rand_x = Math.floor(Math.random() * (canvas.width * 10));
			const rand_y = Math.floor(Math.random() * (canvas.height * 10));
			const rand_color = '#' + Math.floor(Math.random() * 16777215).toString(16);
			const new_circle = new CIRCLE(context, rand_x, rand_y, 10, rand_color, rand_color);
			circles.push(new_circle);
		}

		//main draw method
		function draw_figure() {
			context.clearRect(0, 0, canvas.width, canvas.height);
			for (let i = 0; i < circles.length; i++) {
				if (circles[i].is_visible()) { circles[i].draw(); }
			}
		}

		function mouse_move(e) {
			if (!is_mouse_down) { return; }
			const mouse_position = get_mouse_position(e);
			//if any circle is focused
			if (focused.state) {
				circles[focused.key].x = mouse_position.x;
				circles[focused.key].y = mouse_position.y;
				draw_figure();
				return;
			}
			//no circle currently focused check if circle is hovered
			for (let i = 0; i < circles.length; i++) {
				if (circles[i].is_visible()) {
					if (intersects(circles[i], mouse_position.x, mouse_position.y)) {
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
				for (let i = 0; i < circles.length; i++) {
					circles[i].x += delta_x;
					circles[i].y += delta_y;
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
			for (let i = 0; i < circles.length; i++) {
				let delta_x = (circles[i].x - mouse_position.x) * scale;
				let delta_y = (circles[i].y - mouse_position.y) * scale;
				circles[i].x = mouse_position.x + delta_x;
				circles[i].y = mouse_position.y + delta_y;
				circles[i].r *= scale;
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

		draw_figure();
		return canvas;

	}

}
