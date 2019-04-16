const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');

const common = require('./webpack-common');

const PLUGINS = [
	new webpack.DefinePlugin({
		DEBUG: false
	})
];

module.exports = merge(common, {
	entry: './src/index.js',
	output: {
		path: path.join(__dirname, '../build'),
		filename: 'aframe-component-ambisonic.min.js'
	},
	plugins: PLUGINS,
	devtool: 'source-map'
});
