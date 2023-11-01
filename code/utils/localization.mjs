/**
 * Attach a "localized" property to an object that returns a localized & sorted version.
 * @param {object} config - Configuration object to modify.
 * @param {object} [options={}] - Options to pass through to the makeLabels function.
 * @param {string} [options.propertyName] - Name where the localized string is stored.
 */
export function localizeConfig(config, { propertyName="localized", ...options }={}) {
	Object.defineProperty(config, propertyName, {
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
 * @param {string} [options.labelKeyPath="label"] - Path to the standard label.v
 * @param {string} [options.localizationKeyPath="label"] - Path to the pluralizable label.
 * @returns {object}
 */
export function makeLabels(object, {
	sort=true, pluralRule="one", labelKeyPath="label", localizationKeyPath="localization"
}={}) {
	const localized = Object.entries(object)
		.map(([k, d]) => [k, game.i18n.localize(
			foundry.utils.getProperty(d, labelKeyPath) ?? `${foundry.utils.getProperty(d, localizationKeyPath)}[one]`
		)]);
	if ( sort ) localized.sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]));
	return Object.fromEntries(localized);
}
