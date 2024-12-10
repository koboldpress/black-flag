import { getPluralRules } from "./localization.mjs";
import { isValidUnit } from "./validation.mjs";

/**
 * Convert the provided weight to another unit.
 * @param {number} value - The weight value to convert.
 * @param {string} from - The initial units.
 * @param {string} to - The final units.
 * @returns {number}
 */
export function convertWeight(value, from, to) {
	if ( from === to ) return value;
	const message = unit => `Weight unit ${unit} not defined in CONFIG.BlackFlag.weightUnits`;
	if ( !CONFIG.BlackFlag.weightUnits[from] ) throw new Error(message(from));
	if ( !CONFIG.BlackFlag.weightUnits[to] ) throw new Error(message(to));
	return value
		* CONFIG.BlackFlag.weightUnits[from].conversion
		/ CONFIG.BlackFlag.weightUnits[to].conversion;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Cached store of Intl.NumberFormat instances.
 * @type {{[key: string]: Intl.PluralRules}}
 */
const _numberFormatters = {};

/**
 * Get a PluralRules object, fetching from cache if possible.
 * @param {object} [options={}]
 * @returns {Intl.PluralRules}
 */
export function getNumberFormatter(options={}) {
	const key = JSON.stringify(options);
	_numberFormatters[key] ??= new Intl.NumberFormat(game.i18n.lang, options);
	return _numberFormatters[key];
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Format a challenge rating into a fraction if less than one.
 * @param {number|null} value
 * @param {object} [options={}]
 * @param {boolean} [options.narrow=true] - Use narrow fractions (e.g. ⅛) rather than wide ones (e.g. 1/8).
 * @returns {string}
 */
export function formatCR(value, { narrow=true }={}) {
	if ( value === null ) return "—";
	const fractions = narrow ? { 0.125: "⅛", 0.25: "¼", 0.5: "½" } : { 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" };
	return fractions[value] ?? numberFormat(value);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Form a number using the provided distance unit.
 * @param {number} value - The distance to format.
 * @param {string} unit - Distance unit as defined in `CONFIG.BlackFlag.distanceUnits`.
 * @param {Partial<NumberFormattingOptions>} [options={}] - Formatting options passed to `formatNumber`.
 * @returns {string}
 */
export function formatDistance(value, unit, options={}) {
	return _formatSystemUnits(value, unit, CONFIG.BlackFlag.distanceUnits[unit], options);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * @typedef {NumberFormattingOptions}
 * @param {number} decimals - Number of decimal digits to display.
 * @param {number} digits - Number of digits before the decimal point to display.
 * @param {boolean} ordinal - Produce an ordinal version of the number.
 * @param {boolean} sign - Should the sign always be displayed?
 * @param {string} [signDisplay] - Override more specific sign display option.
 * @param {boolean} spelledOut - Should small numbers be spelled out?
 * @param {string} unit - What unit should be displayed?
 * @param {string} unitDisplay - Unit display style.
 */

/**
 * Take number formatting options and convert them into a format usable by `Intl.NumberFormat`.
 * @param {NumberFormattingOptions} options
 * @returns {object}
 */
function _prepareFormattingOptions(options) {
	const formatterOptions = {};
	if ( options.signDisplay ) formatterOptions.signDisplay = options.signDisplay;
	else if ( options.sign ) formatterOptions.signDisplay = "always";
	if ( options.decimals !== undefined ) {
		formatterOptions.minimumFractionDigits = options.decimals;
		formatterOptions.maximumFractionDigits = options.decimals;
	}
	if ( options.digits !== undefined ) {
		formatterOptions.minimumIntegerDigits = options.digits;
		formatterOptions.maximumIntegerDigits = options.digits;
	}
	if ( options.unit && isValidUnit(options.unit) ) {
		formatterOptions.style = "unit";
		formatterOptions.unit = options.unit.formattingUnit ?? options.unit;
		formatterOptions.unitDisplay = options.unitDisplay;
		options.unitFallback = false;
	}
	return formatterOptions;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Format a number based on the current locale.
 * @param {number} value - A number for format.
 * @param {NumberFormattingOptions} [options] - Additional formatting options.
 * @returns {string}
 */
export function numberFormat(value, options={}) {
	value = Number(value);

	if ( !Number.isFinite(value) ) {
		value = "∞";
		if ( !options.spelledOut ) return value;
	}
	if ( options.spelledOut ) {
		const key = `BF.Number[${value}]`;
		if ( game.i18n.has(key) ) return game.i18n.localize(key);
	}

	let formatted = getNumberFormatter(_prepareFormattingOptions(options)).format(value);

	if ( options.ordinal ) {
		const rule = getPluralRules({ type: "ordinal" }).select(value);
		const key = `BF.Number.Ordinal[${rule}]`;
		if ( game.i18n.has(key) ) formatted = game.i18n.format(key, { number: formatted });
	}

	if ( options.unit?.localization && (options.unitFallback !== false) ) {
		const key = `${options.unit.localization}[${getPluralRules().select(value)}]`;
		formatted += ` ${game.i18n.localize(key).toLowerCase()}`;
	}

	return formatted;
}

/**
 * Format a number based on the current locale.
 * @param {number} value - A number for format.
 * @param {NumberFormattingOptions} [options] - Additional formatting options.
 * @returns {string}
 */
export function formatNumber(value, options) {
	return numberFormat(value, options);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Form a number using the provided pace unit.
 * @param {number} value - The time to format.
 * @param {string} unit - Time unit as defined in `CONFIG.BlackFlag.timeUnits.time.children`.
 * @param {Partial<NumberFormattingOptions>} [options={}] - Formatting options passed to `formatNumber`.
 * @param {string} [options.period="hour"] - Time period formatting unit (e.g. hour or day).
 * @returns {string}
 */
export function formatPace(value, unit, { period="hour", ...options }={}) {
	const unitConfig = CONFIG.BlackFlag.paceUnits[unit];
	options.unit ??= `${unitConfig?.formattingUnit ?? unit}-per-${period}`;
	return _formatSystemUnits(value, unit, unitConfig, options);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Produce a number with the parts wrapped in their own spans.
 * @param {number} value - A number for format.
 * @param {NumberFormattingOptions} [options] - Additional formatting options.
 * @returns {string}
 */
export function numberParts(value, options) {
	const parts = getNumberFormatter(_prepareFormattingOptions(options)).formatToParts(value);
	return parts.reduce((str, { type, value }) => `${str}<span class="${type}">${value}</span>`, "");
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Form a number using the provided time unit.
 * @param {number} value - The time to format.
 * @param {string} unit - Time unit as defined in `CONFIG.BlackFlag.timeUnits`.
 * @param {Partial<NumberFormattingOptions>} [options={}] - Formatting options passed to `formatNumber`.
 * @returns {string}
 */
export function formatTime(value, unit, options={}) {
	const unitConfig = CONFIG.BlackFlag.timeUnits.time.children[unit] ?? CONFIG.BlackFlag.timeUnits.combat.children[unit];
	return _formatSystemUnits(value, unit, unitConfig, options);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Form a number using the provided volume unit.
 * @param {number} value - The volume to format.
 * @param {string} unit - Volume unit as defined in `CONFIG.BlackFlag.volumeUnits`.
 * @param {Partial<NumberFormattingOptions>} [options={}] - Formatting options passed to `formatNumber`.
 * @returns {string}
 */
export function formatVolume(value, unit, options={}) {
	return _formatSystemUnits(value, unit, CONFIG.BlackFlag.volumeUnits[unit], options);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Form a number using the provided weight unit.
 * @param {number} value - The weight to format.
 * @param {string} unit - Weight unit as defined in `CONFIG.BlackFlag.weightUnits`.
 * @param {Partial<NumberFormattingOptions>} [options={}] - Formatting options passed to `formatNumber`.
 * @returns {string}
 */
export function formatWeight(value, unit, options={}) {
	return _formatSystemUnits(value, unit, CONFIG.BlackFlag.weightUnits[unit], options);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Format a number using one of core's built-in unit types.
 * @param {number} value - Value to display.
 * @param {string} unit - Name of the unit to use.
 * @param {UnitConfiguration} config - Configuration data for the unit.
 * @param {Partial<NumberFormattingOptions>} [options={}] - Formatting options passed to `formatNumber`.
 * @returns {string}
 */
function _formatSystemUnits(value, unit, config, options={}) {
	options.unitDisplay ??= "long";
	if ( config?.counted ) {
		const localizationKey = `${config.counted}.${options.unitDisplay}.${getPluralRules().select(value)}`;
		return game.i18n.format(localizationKey, { number: formatNumber(value, options) });
	}
	return formatNumber(value, { unit: config?.formattingUnit ?? unit, ...options });
}
