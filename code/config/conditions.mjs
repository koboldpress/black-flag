/**
 * Core status effects that shouldn't be replaced by system-specific conditions.
 * @type {string[]}
 */
export const retainedStatusEffects = ["dead"];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Conditions that should replace existing special status effects.
 * @enum {string}
 */
export const specialStatusEffects = {
	BLIND: "blinded"
};
