const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');

const common = require('./webpack-common');

const PLUGINS = [
	new webpack.DefinePlugin({
		DEBUG: false
	})
];

const config = merge(common, {
	entry: './src/index.js',
	target: 'node',
	externals: [nodeExternals()],
	output: {
		path: path.join(__dirname, '../build'),
		filename: 'index.js',
		libraryTarget: 'commonjs2'
	},
	plugins: PLUGINS,
	devtool: 'source-map',
	optimization: {
		minimize: false
	}
});

module.exports = config;