///////////////////////////////////////////////////////////////////////////////
// vector.js

function VECTOR_1D(x) {
	this.x = x || 0;
}

function VECTOR_2D(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

function VECTOR_3D(x, y, z) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
}

///////////////////////////////////////////////////////////////////////////////

module.exports = {
	VECTOR_1D: VECTOR_1D,
	VECTOR_2D: VECTOR_2D,
	VECTOR_3D: VECTOR_3D
}