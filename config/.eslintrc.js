const eslintConfig = require('datavized-code-style');
module.exports = Object.assign(eslintConfig, {
	env: {
		browser: false,
		node: true,
		es6: true,
		commonjs: true
	}
});