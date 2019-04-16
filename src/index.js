/* global AFRAME, DEBUG */

if (typeof AFRAME === 'undefined') {
	throw new Error('Component attempted to register before AFRAME was available. Did you include A-Frame?');
}

const VERSION = require('../package.json').version;

const log = AFRAME.utils.debug;
// const error = log('A-Frame Ambisonic Audio Component:error')
const info = log('A-Frame Ambisonic Audio Component:info');
const warn = log('A-Frame Ambisonic Audio Component:warn');

if (module.hot) {
	module.hot.accept();
}

if (DEBUG) {
	info(`Version: ${VERSION}-dev`);
} else {
	warn(`Version: ${VERSION}`);
}

import './ambisonic-audio';
