const merge = require('webpack-merge');
const config = require('./webpack-prod');

module.exports = merge(config, {
	output: {
		filename: 'aframe-ambisonic-component-no-omnitone.min.js'
	},
	externals: {
		omnitone: 'Omnitone'
	}
});
