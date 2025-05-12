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
			extract: path.resolve("black-flag.css"),
			sourceMap: true
		})
	],
	external: []
};
