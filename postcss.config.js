const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
	plugins: [
		require("postcss-import"),
		postcssPresetEnv({
			features: {
				"is-pseudo-class": false,
				"logical-properties-and-values": false
			}
		})
	]
};
