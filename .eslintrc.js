/* eslint-env node, browser: false */
const eslintConfig = require('datavized-code-style');
module.exports = Object.assign(eslintConfig, {
	env: {
		browser: true,
		es6: true,
		commonjs: true
	},
	rules: Object.assign(eslintConfig.rules, {
		'no-invalid-this': 0
	})
});
