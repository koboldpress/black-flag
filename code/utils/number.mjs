import { getPluralLocalizationKey, getPluralRules } from "./localization.mjs";
import { isValidUnit } from "./validation.mjs";

/**
 * @import { LocalizableUnitType } from "../data/settings/localization-setting.mjs"
 */

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                      Conversion                       */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * @typedef UnitConversionOptions
 * @property {boolean} [strict] - Throw an error if either unit isn't found.
 * @property {string} [system] - Target measurement system. If provided without target unit then the value will be
 *                               converted to the closest equivalent unit in the specified measurement system
 *                               (e.g. "mi" > "km").
 * @property {string} [to] - The final unit. If neither this nor the unit system is provided then will convert to
 *                           the largest unit that can represent the value as an integer.
 */

/**
 * Convert the provided object in place to the appropriate units in the desired measurement system.
 * @param {{ value: number, unit: string }} obj - Object to convert.
 * @param {LocalizableUnitType} type - Type of unit represented.
 * @param {object} [options={}]
 * @param {string[]} [options.keys] - Keys representing the value in the object to convert.
 * @param {string} [options.valueObjectKey] - Key for object within the parent object that contains values.
 */
export function convertAmount(obj, type, { keys=["value"], valueObjectKey }={}) {
	const system = game.settings.get(game.system.id, "localization").preferredSystem(type);
	if ( !system ) return;

	let valueObject = obj;
	if ( valueObjectKey ) {
		valueObject = obj[valueObjectKey];
		keys = Object.keys(valueObject);
	}

	let units;
	switch (type) {
		case "distance":  units = CONFIG.BlackFlag.distanceUnits; break;
		case "pace": units = CONFIG.BlackFlag.paceUnits; break;
		case "volume": units = CONFIG.BlackFlag.volumeUnits; break;
		case "cargo":
		case "weight": units = CONFIG.BlackFlag.weightUnits; break;
	}
	if ( !(obj.unit in units) ) return;
	let baseUnit = obj.unit;
	const to = obj.unit = preferredUnit(obj.unit, { system, units });

	for ( const key of keys ) {
		if ( !valueObject[key] ) continue;
		valueObject[key] = _convertSystemUnits(valueObject[key], baseUnit, units, { to }).value;
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Convert the provided distance to another unit.
 * @param {number} value - The distance being converted.
 * @param {string} from - The initial unit as defined in `CONFIG.BlackFlag.distanceUnits`.
 * @param {UnitConversionOptions} [options={}]
 * @returns {{ value: number, unit: string }}
 */
export function convertDistance(value, from, options={}) {
	const message = unit => `Distance unit ${unit} not defined in CONFIG.BlackFlag.distanceUnits`;
	return _convertSystemUnits(value, from, CONFIG.BlackFlag.distanceUnits, { ...options, message });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Convert the provided pace to another unit.
 * @param {number} value - The pace being converted.
 * @param {string} from - The initial unit as defined in `CONFIG.BlackFlag.paceUnits`.
 * @param {UnitConversionOptions} [options={}]
 * @returns {{ value: number, unit: string }}
 */
export function convertPace(value, from, options={}) {
	const message = unit => `Pace unit ${unit} not defined in CONFIG.BlackFlag.paceUnits`;
	return _convertSystemUnits(value, from, CONFIG.BlackFlag.paceUnits, { ...options, message });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Convert the provided time value to another unit. If no final unit is provided, then will convert it to the largest
 * unit that can still represent the value as a whole number.
 * @param {number} value - The time being converted.
 * @param {string} from - The initial unit as defined in `CONFIG.BlackFlag.timeUnits`.
 * @param {UnitConversionOptions} [options={}]
 * @param {boolean} [options.combat=false] - Use combat units when auto-selecting unit, rather than normal units.
 * @returns {{ value: number, unit: string }}
 */
export function convertTime(value, from, options={}) {
	let config = { ...CONFIG.BlackFlag.timeUnits.time.children };
	if ( options.combat ) Object.assign(config, CONFIG.BlackFlag.timeUnits.combat.children);
	const message = unit => `Time unit ${unit} not defined in CONFIG.BlackFlag.timeUnits`;
	return _convertSystemUnits(value, from, config, { ...options, message });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Convert the provided volume to another unit.
 * @param {number} value - The volume being converted.
 * @param {string} from - The initial unit as defined in `CONFIG.BlackFlag.volumeUnits`.
 * @param {UnitConversionOptions} [options={}]
 * @returns {{ value: number, unit: string }}
 */
export function convertVolume(value, from, options={}) {
	const message = unit => `Volume unit ${unit} not defined in CONFIG.BlackFlag.volumeUnits`;
	return _convertSystemUnits(value, from, CONFIG.BlackFlag.volumeUnits, { ...options, message });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Convert the provided weight to another unit.
 * @param {number} value - The weight value being converted.
 * @param {string} from - The initial unit as defined in `CONFIG.BlackFlag.weightUnits`.
 * @param {UnitConversionOptions} [options={}]
 * @returns {{ value: number, unit: string }|number}
 */
export function convertWeight(value, from, options={}) {
	const message = unit => `Weight unit ${unit} not defined in CONFIG.BlackFlag.weightUnits`;
	return _convertSystemUnits(value, from, CONFIG.BlackFlag.weightUnits, { ...options, message });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Is the approximate conversion option enabled?
 * @type {boolean}
 */
let _approximateConversion;

/**
 * Retrieve the conversion value for the provided unit config.
 * @param {UnitConfiguration} config
 * @returns {number}
 */
function _conversion(config={}) {
	if ( _approximateConversion === undefined ) {
		_approximateConversion = game.settings.get(game.system.id, "localization").approximateConversion;
	}
	if ( _approximateConversion || !("exactConversion" in config) ) return config.conversion ?? 1;
	return config.exactConversion;
}

/**
 * Convert from one unit to another using one of core's built-in unit types.
 * @param {number} value - Value to display.
 * @param {string} from - The initial unit.
 * @param {Record<string, UnitConfiguration>} config - Configuration data for the available units.
 * @param {UnitConversionOptions} options
 * @param {function(string): string} [options.message] - Method used to produce the error message if unit not found.
 * @returns {{ value: number, unit: string }}
 */
export function _convertSystemUnits(value, from, config, { message, strict, system, to }) {
	if ( (from === to) || (!to && system && (config[from]?.system === system)) ) return { value, unit: from };
	if ( strict && !config[from] ) throw new Error(message(from));
	if ( strict && to && !config[to] ) throw new Error(message(to));
	if ( !config[from] ) return { value, unit: from ?? to };

	// If measurement system is provided and no target unit, convert to equivalent unit in other measurement system
	if ( !to && system ) to = preferredUnit(from, { system, units: config });

	// If no target unit available, find largest unit in current measurement system that can represent number
	else if ( !to ) {
		const base = value * _conversion(config[from]);
		const unitOptions = Object.entries(config)
			.reduce((arr, [key, v]) => {
				const conversion = _conversion(v);
				if ( ((base % conversion === 0) || (base >= conversion * 2)) && (config[from].system === v.system) ) {
					arr.push({ key, conversion });
				}
				return arr;
			}, [])
			.sort((lhs, rhs) => rhs.conversion - lhs.conversion);
		to = unitOptions[0]?.key ?? from;
	}

	if ( !config[to] ) return { value, unit: from };
	return { value: value * _conversion(config[from]) / _conversion(config[to]), unit: to };
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                        Defaults                       */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Default unit to use depending on system setting.
 * @param {LocalizableUnitType} type - Type of unit to select.
 * @returns {string}
 */
export function defaultUnit(type) {
	return game.settings.get(game.system.id, "localization").defaultUnit(type);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Cache of best unit conversions from one measurement system to another.
 * @type {Map<string, string>}
 */
const _measurementSystemConversionCache = new Map();

/**
 * Find the preferred unit from the config in the provided measurement system. Must provide either type or units.
 * @param {string} from - Original unit to find closest unit in preferred system.
 * @param {object} config
 * @param {string} config.system - Target measurement system.
 * @param {LocalizableUnitType} [config.type] - Type of unit to select.
 * @param {Record<string, UnitConfiguration>} [config.units] - Configuration data for the available units.
 * @returns {string}
 */
export function preferredUnit(from, { system, type, units }={}) {
	if ( !units ) {
		switch (type) {
			case "distance": units = CONFIG.BlackFlag.distanceUnits; break;
			case "pace": units = CONFIG.BlackFlag.paceUnits; break;
			case "volume": units = CONFIG.BlackFlag.volumeUnits; break;
			case "cargo":
			case "weight": units = CONFIG.BlackFlag.weightUnits; break;
		}
	}

	if ( !_measurementSystemConversionCache.has(from) ) {
		const baseConversion = Math.log10(_conversion(units[from]));
		const unitOptions = Object.entries(units)
			.reduce((arr, [key, v]) => {
				if ( system === v.system ) {
					arr.push({ key, difference: Math.abs(Math.log10(_conversion(v)) - baseConversion) });
				}
				return arr;
			}, [])
			.sort((lhs, rhs) => lhs.difference - rhs.difference);
		_measurementSystemConversionCache.set(from, unitOptions[0]?.key ?? from);
	}
	return _measurementSystemConversionCache.get(from);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                      Formatting                       */
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
	return fractions[value] ?? formatNumber(value);
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
 * @param {NumberFormattingOptions} [options={}] - Additional formatting options.
 * @returns {string}
 */
export function formatNumber(value, options={}) {
	value = Number(value);

	if ( !Number.isFinite(value) ) {
		value = "∞";
		if ( !options.spelledOut ) return value;
	}
	if ( options.spelledOut ) {
		const key = `BF.Number[${value}]`;
		if ( game.i18n.has(key) ) return _loc(key);
	}

	let formatted = getNumberFormatter(_prepareFormattingOptions(options)).format(value);

	if ( options.ordinal ) {
		const rule = getPluralRules({ type: "ordinal" }).select(value);
		const key = `BF.Number.Ordinal[${rule}]`;
		if ( game.i18n.has(key) ) formatted = _loc(key, { number: formatted });
	}

	if ( options.unit?.localization && (options.unitFallback !== false) ) {
		const key = getPluralLocalizationKey(value, pr => `${options.unit.localization}[${pr}]`);
		formatted += ` ${_loc(key).toLowerCase()}`;
	}

	return formatted;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Produce a number with the parts wrapped in their own spans.
 * @param {number} value - A number for format.
 * @param {NumberFormattingOptions} [options={}] - Additional formatting options.
 * @returns {string}
 */
export function formatNumberParts(value, options={}) {
	const parts = getNumberFormatter(_prepareFormattingOptions(options)).formatToParts(value);
	return parts.reduce((str, { type, value }) => `${str}<span class="${type}">${value}</span>`, "");
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Form a number using the provided pace unit.
 * @param {number} value - The pace to format.
 * @param {string} unit - Pace unit as defined in `CONFIG.BlackFlag.paceUnits`.
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
 * @param {Record<string, UnitConfiguration>} config - Configuration data for the available units.
 * @param {Partial<NumberFormattingOptions>} [options={}] - Formatting options passed to `formatNumber`.
 * @returns {string}
 */
function _formatSystemUnits(value, unit, config, options={}) {
	options.unitDisplay ??= "short";
	if ( config?.counted ) {
		const localizationKey = getPluralLocalizationKey(value, pr => `${config.counted}.${options.unitDisplay}.${pr}`);
		return _loc(localizationKey, { number: formatNumber(value, options) });
	}
	return formatNumber(value, { unit: config?.formattingUnit ?? unit, ...options });
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Handle a delta input for a number value from a form.
 * @param {HTMLInputElement} input - Input that contains the modified value.
 * @param {Document} target - Target document to be updated.
 * @returns {number|void}
 */
export function parseInputDelta(input, target) {
	let value = input.value;
	if ( ["+", "-"].includes(value[0]) ) {
		const delta = parseFloat(value);
		value = Number(foundry.utils.getProperty(target, input.dataset.name ?? input.name)) + delta;
	}
	else if ( value[0] === "=" ) value = Number(value.slice(1));
	if ( Number.isNaN(value) ) return;
	input.value = value;
	return value;
}
