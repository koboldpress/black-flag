import { sortObjectEntries } from "./object.mjs";

/**
 * Cached store of Intl.ListFormat instances.
 * @type {{[key: string]: Intl.PluralRules}}
 */
const _pluralRules = {};

/**
 * Get a PluralRules object, fetching from cache if possible.
 * @param {object} [options={}]
 * @param {string} [options.type=cardinal]
 * @returns {Intl.PluralRules}
 */
export function getPluralRules({ type="cardinal" }={}) {
	_pluralRules[type] ??= new Intl.PluralRules(game.i18n.lang, { type });
	return _pluralRules[type];
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

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
 * @param {string} [options.labelKeyPath="label"] - Path to the standard label.
 * @param {string} [options.localizationKeyPath="label"] - Path to the pluralizable label.
 * @param {boolean} [options.objectOutput=false] - Output values as objects with label property.
 * @returns {object}
 */
export function makeLabels(object, {
	sort=true, pluralRule="one", labelKeyPath="label", localizationKeyPath="localization", objectOutput=false
}={}) {
	const localized = Object.entries(object).map(([k, d]) => {
		const label = makeLabel(d, { pluralRule, labelKeyPath, localizationKeyPath });
		return [k, objectOutput ? { ...d, [labelKeyPath]: label } : label];
	});
	if ( sort && objectOutput ) sortObjectEntries(localized, labelKeyPath);
	else if ( sort ) localized.sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]));
	return Object.fromEntries(localized);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Create a label for the provided object using either a "localization" value with the provided
 * plural role or a "label" value.
 * @param {object|string} input
 * @param {object} [options={}]
 * @param {string} [options.pluralRule="one"] - Pluralization rule to use with localization value.
 * @param {string} [options.labelKeyPath="label"] - Path to the standard label.
 * @param {string} [options.localizationKeyPath="label"] - Path to the pluralizable label.
 * @returns {string}
 */
export function makeLabel(input, { pluralRule="one", labelKeyPath="label", localizationKeyPath="localization" }={}) {
	return game.i18n.localize(
		foundry.utils.getType(input) === "string" ? input
			: foundry.utils.getProperty(input, labelKeyPath)
      ?? `${foundry.utils.getProperty(input, localizationKeyPath)}[${pluralRule}]`
	);
}
