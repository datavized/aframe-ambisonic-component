module.exports = {
	externals: {
		// three: 'THREE',
		aframe: 'AFRAME'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				enforce: 'pre',
				loader: 'eslint-loader',
				options: {
					// formatter: eslintFormatter,
					// failOnHint: env === 'production',
					emitWarning: true
				}
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: {
					cacheDirectory: true
				}
			}
		]
	}
};