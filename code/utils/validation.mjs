/**
 * Ensure the provided string contains only the characters allowed in identifiers.
 * @param {string} identifier - Identifier to verify.
 * @param {object} [options={}]
 * @param {boolean} [options.allowType] - Consider an identifier with a single ":" to be valid. Only the portion after
 *                                        the colon must follow the strict identifier validation.
 * @returns {boolean}
 */
export function isValidIdentifier(identifier, { allowType=false }={}) {
	if ( allowType ) {
		const split = identifier.split(":");
		if ( split.length > 2 ) return false;
		identifier = split[1];
	}
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
	if ( unit?.includes("-per-") ) return unit.split("-per-").every(u => isValidUnit(u));
	return Intl.supportedValuesOf("unit").includes(unit);
}
