/**
 * Determine which keys are pressed that might trigger the provided keybinding.
 * @param {Event} event - Triggering event.
 * @param {string} action - Keybinding action within the `black-flag` namespace.
 * @returns {boolean} - Should this action be triggered?
 */
export function areKeysPressed(event, action) {
	if ( !event ) return false;
	const activeModifiers = {};
	const addModifiers = (key, pressed) => {
		activeModifiers[key] = pressed;
		KeyboardManager.MODIFIER_CODES[key].forEach(n => activeModifiers[n] = pressed);
	}
	addModifiers(KeyboardManager.MODIFIER_KEYS.CONTROL, event.ctrlKey || event.metaKey);
	addModifiers(KeyboardManager.MODIFIER_KEYS.SHIFT, event.shiftKey);
	addModifiers(KeyboardManager.MODIFIER_KEYS.ALT, event.altKey);
	return game.keybindings.get(game.system.id, action).some(b => {
		if ( game.keyboard.downKeys.has(b.key) && b.modifiers.every(m => activeModifiers[m]) ) return true;
		if ( b.modifiers.length ) return false;
		return activeModifiers[b.key];
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Construct roll parts and populate its data object.
 * @param {object} parts - Information on the parts to be constructed.
 * @param {object} [data] - Roll data to use and populate while constructing the parts.
 * @returns {{ parts: string[], data: object }}
 */
export function buildRoll(parts, data={}) {
	const finalParts = [];
	for ( let [key, value] of Object.entries(parts) ) {
		if ( !value && (value !== 0) ) continue;
		finalParts.push(`@${key}`);
		foundry.utils.setProperty(data, key, foundry.utils.getType(value) === "string"
			? Roll.replaceFormulaData(value, data) : value);
	}
	return { parts: finalParts, data };
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Step a dice denomination up or down by a certain number of steps, never going beyond the bounds of the allowed dice.
 * If decrease below minimum denomination it will return `null` indicating no dice should be rolled.
 * @param {number} denomination - Starting denomination.
 * @param {number} [step=1] - Number of steps to increase or decrease the denomination.
 * @returns {number|null}
 */
export function stepDenomination(denomination, step=1) {
	return CONFIG.BlackFlag.dieSteps[Math.min(
		CONFIG.BlackFlag.dieSteps.indexOf(denomination) + step,
		CONFIG.BlackFlag.dieSteps.length - 1
	)] ?? null;
}
