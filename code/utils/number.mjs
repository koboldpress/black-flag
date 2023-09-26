/**
 * Format a number based on the current locale.
 * @param {number} value - A numeric value to format.
 * @param {object} [options={}]
 * @param {number} [options.decimals] - Number of decimal digits to display.
 * @param {number} [options.digits] - Number of digits before the decimal point to display.
 * @param {boolean} [options.sign] - Should the sign always be displayed?
 * @param {string} [options.unit] - What unit should be displayed?
 * @param {string} [options.unitDisplay] - Unit display style.
 * @param {boolean} [options.spelledOut] - Should small numbers be spelled out?
 * @returns {string}
 */
export function numberFormat(value, options={}) {
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
		formatterOptions.unit = options.unit;
		formatterOptions.unitDisplay = options.unitDisplay;
		options.unitFallback = false;
	}

	const formatter = new Intl.NumberFormat(game.i18n.lang, formatterOptions);
	let formatted = formatter.format(value);

	return formatted;
}
