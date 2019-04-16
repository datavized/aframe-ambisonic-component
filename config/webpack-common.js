const eslintConfig = require('../.eslintrc.js');

const browsers = [
	'>0.05%',
	'last 4 versions',
	'Firefox ESR',
	'ie >= 11',
	'not dead'
];

module.exports = {
	externals: {
		three: 'THREE',
		aframe: 'AFRAME'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				enforce: 'pre',
				loader: 'eslint-loader',
				options: Object.assign({}, eslintConfig, {
					// formatter: eslintFormatter,
					// failOnHint: env === 'production',
					emitWarning: true
				})
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: {
					babelrc: false,
					presets: [
						[
							'@babel/env',
							{
								exclude: [
									'transform-regenerator',
									'transform-async-to-generator'
								],
								targets: {
									browsers
								},
								useBuiltIns: false,
								modules: false
							}
						]
					],
					plugins: [
						'@babel/plugin-proposal-class-properties',
						['@babel/plugin-proposal-object-rest-spread', { useBuiltIns: true }],
						['@babel/plugin-transform-runtime', {
							helpers: false,
							regenerator: true
						}],
						'@babel/plugin-syntax-dynamic-import',
						'module:fast-async'
					],
					cacheDirectory: true
				}
			}
		]
	},
	resolve: {
		alias: {
			omnitone: 'omnitone/build/omnitone.esm'
		}
	}
};