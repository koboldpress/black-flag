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
 * Format a number based on the current locale.
 * @param {number} value - A numeric value to format.
 * @param {object} [options={}]
 * @param {number} [options.decimals] - Number of decimal digits to display.
 * @param {number} [options.digits] - Number of digits before the decimal point to display.
 * @param {boolean} [options.ordinal] - Produce an ordinal version of the number.
 * @param {boolean} [options.sign] - Should the sign always be displayed?
 * @param {boolean} [options.spelledOut] - Should small numbers be spelled out?
 * @param {string} [options.unit] - What unit should be displayed?
 * @param {string} [options.unitDisplay] - Unit display style.
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

	const formatterOptions = {};
	if ( options.sign ) formatterOptions.signDisplay = "always";
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

	let formatted = getNumberFormatter(formatterOptions).format(value);

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
