/**
 * Attach a "localized" property to an object that returns a localized & sorted version.
 * @param {object} config - Configuration object to modify.
 * @param {object} [options] - Options to pass through to the makeLabels function.
 */
export function localizeConfig(config, options) {
	Object.defineProperty(config, "localized", {
		get() {
			return makeLabels(config, options);
		},
		enumerable: false
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create labels for the provided object using either a "localization" value with the provided
 * plural role or a "label" value.
 * @param {object} object
 * @param {object} [options={}]
 * @param {boolean} [options.sort=true] - Should the localized results be sorted?
 * @param {string} [options.pluralRule="one"] - Pluralization rule to use with localization value.
 * @returns {object}
 */
export function makeLabels(object, { sort=true, pluralRule="one" }={}) {
	const localized = Object.entries(object)
		.map(([k, d]) => [k, game.i18n.localize(d.label ? d.label : `${d.localization}[one]`)]);
	if ( sort ) localized.sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]));
	return Object.fromEntries(localized);
}
