/* global DEBUG */

let log;
let warn;

const AFRAME = window.AFRAME;
if (typeof DEBUG !== 'undefined' && DEBUG && AFRAME) {
	log = AFRAME.utils.debug('components:ambisonic:info');
	warn = AFRAME.utils.debug('components:ambisonic:warn');
} else {
	log = warn = () => {};
}

export { log, warn };