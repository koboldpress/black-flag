/**
 * Slugify the provided string with additional improvements to handle works separated by slashes
 * (e.g. `this/that` becomes `this-that` rather than `thisthat`).
 * @param {string} text - Text to slugify.
 * @param {object} options - Options passed to the core slugify function.
 * @returns {string}
 */
export function slugify(text, options) {
	text = text.replaceAll(/(\w+)([\\|/])(\w+)/g, "$1-$3");
	return text.slugify(options);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create an ID from the input truncating or padding the value to make it reach 16 characters.
 * @param {string} id
 * @returns {string}
 */
export function staticID(id) {
	if ( id.length >= 16 ) return id.substring(0, 16);
	return id.padEnd(16, "0");
}
