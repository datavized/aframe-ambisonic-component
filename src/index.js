/* global AFRAME */
if (typeof AFRAME === 'undefined') {
	throw new Error('Component attempted to register before AFRAME was available. Did you include A-Frame?');
}

if (module.hot) {
	module.hot.accept();
}

require('./ambisonic-audio');
