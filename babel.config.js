const browsers = [
	'>0.05%',
	'last 4 versions',
	'Firefox ESR',
	'ie >= 11',
	'not dead'
];

module.exports = {
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
	]
};