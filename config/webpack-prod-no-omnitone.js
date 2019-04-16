const merge = require('webpack-merge');
const config = require('./webpack-prod');

module.exports = merge(config, {
	output: {
		filename: 'aframe-component-ambisonic-no-omnitone.min.js'
	},
	externals: {
		omnitone: 'Omnitone'
	}
});
