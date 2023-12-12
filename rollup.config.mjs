import path from "path";
import postcss from "rollup-plugin-postcss";

export default {
	input: "code/_module.mjs",
	output: {
		file: "black-flag.mjs",
		format: "es",
		sourcemap: true
	},
	plugins: [
		postcss({
			extract: path.resolve("black-flag.css")
		})
	],
	external: [
		"https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/icon/icon.js",
		"https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/icon-button/icon-button.js",
		"https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/option/option.js",
		"https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/popup/popup.js",
		"https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/select/select.js"
	]
};
