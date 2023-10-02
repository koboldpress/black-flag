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
