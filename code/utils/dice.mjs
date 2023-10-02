/**
 * Determine which keys are pressed that might trigger the provided keybinding.
 * @param {Event} event - Triggering event.
 * @param {string} action - Keybinding action within the `black-flag` namespace.
 * @returns {boolean} - Should this action be triggered?
 */
export function areKeysPressed(event, action) {
	if ( !event ) return false;
	const activeModifiers = {
		[KeyboardManager.MODIFIER_KEYS.CONTROL]: event.ctrlKey || event.metaKey,
		[KeyboardManager.MODIFIER_KEYS.SHIFT]: event.shiftKey,
		[KeyboardManager.MODIFIER_KEYS.ALT]: event.altKey
	};
	return game.keybindings.get(game.system.id, action).some(b => {
		if ( !game.keyboard.downKeys.has(b.key) ) return false;
		return b.modifiers.every(m => activeModifiers[m]);
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Construct roll parts and populate its data object.
 * @param {object} parts - Information on the parts to be constructed.
 * @param {object} data - Roll data to use and populate while constructing the parts.
 * @returns {{ parts: string[], data: object }}
 */
export function buildRoll(parts, data) {
	const finalParts = [];
	for ( let [key, value] of Object.entries(parts) ) {
		if ( !value && (value !== 0) ) continue;
		finalParts.push(`@${key}`);
		foundry.utils.setProperty(data, key, foundry.utils.getType(value) === "string"
			? Roll.replaceFormulaData(value, data) : value);
	}
	return { parts: finalParts, data };
}
