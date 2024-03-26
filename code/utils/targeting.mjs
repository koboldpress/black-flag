/**
 * Get currently selected tokens in the scene or user's character's tokens.
 * @returns {Token5e[]}
 */
export function getSelectedTokens() {
	let targets = canvas.tokens.controlled.filter(t => t.actor);
	if ( !targets.length && game.user.character ) targets = game.user.character.getActiveTokens();
	return targets;
}
