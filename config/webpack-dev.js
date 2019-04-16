const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');

const common = require('./webpack-common');

const PLUGINS = [
	new webpack.DefinePlugin({
		DEBUG: true
	}),
	new webpack.HotModuleReplacementPlugin()
];

module.exports = merge(common, {
	devServer: {
		allowedHosts: [
			'.github.com'
		],
		contentBase: [path.join(__dirname, '../examples'), path.join(__dirname, '../build')],
		host: '0.0.0.0',
		port: 9000,
		hot: true,
		inline: true,
		noInfo: false
	},
	entry: './src/index.js',
	output: {
		path: path.join(__dirname, '../build'),
		filename: 'aframe-component-ambisonic.js'
	},
	plugins: PLUGINS,
	devtool: 'cheap-module-source-map'
});
