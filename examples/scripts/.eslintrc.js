/* eslint-env node, browser: false */
const eslintConfig = require('../../.eslintrc.js');
module.exports = Object.assign({}, eslintConfig, {
	rules: Object.assign(eslintConfig.rules, {
		'no-var': 0
	}),
	globals: {}
});
