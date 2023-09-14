import log from "./logging.mjs";

const cache = {};

export function preCacheSVG() {
	const files = [
		"interface/proficiency.svg"
	];

	for ( const file of files ) {
		const path = `systems/black-flag/artwork/${file}`;
		fetch(path).then(response => response.blob())
			.then(blob => blob.text())
			.then(text => cache[path] = text);
	}
}

/* <><><><> <><><><> <><><><> <><><><> */

/**
 * Load a cached SVG file for display in HTML.
 * @param {string} path - Path from which to get the file.
 * @returns {string}
 */
export function loadCachedSVG(path) {
	if ( !cache[path] ) log(`SVG file was not pre-loaded: ${path}`, { level: "error" });
	return cache[path] ?? "";
}
