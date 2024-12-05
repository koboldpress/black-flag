/**
 * Ensure the provided string contains only the characters allowed in identifiers.
 * @param {string} identifier - Identifier to verify.
 * @returns {boolean}
 */
export function isValidIdentifier(identifier) {
	return /^([a-z0-9_-]+)$/i.test(identifier);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Determine whether the provided unit is usable within `Intl.NumberFormat`.
 * @param {string} unit
 * @returns {boolean}
 */
export function isValidUnit(unit) {
	if ( foundry.utils.getType(unit) === "Object" ) unit = unit.formattingUnit;
	if ( unit.includes("-per-") ) return unit.split("-per-").every(u => isValidUnit(u));
	return Intl.supportedValuesOf("unit").includes(unit);
}
