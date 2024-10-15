/**
 * Get currently selected tokens in the scene or user's character's tokens.
 * @returns {Token5e[]}
 */
export function getSelectedTokens() {
	let targets = canvas.tokens.controlled.filter(t => t.actor);
	if ( !targets.length && game.user.character ) targets = game.user.character.getActiveTokens();
	return targets;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Important information on a targeted token.
 *
 * @typedef {object} TargetDescriptor
 * @property {string} uuid - The UUID of the target.
 * @property {string} img - The target's image.
 * @property {string} name - The target's name.
 * @property {number} [ac] - The target's armor class, if applicable.
 */

/**
 * Grab the targeted tokens and return relevant information on them.
 * @returns {TargetDescriptor[]}
 */
export function getTargetDescriptors() {
	const targets = new Map();
	for (const token of game.user.targets) {
		const { name } = token;
		const { img, system, uuid } = token.actor ?? {};
		if (uuid) targets.set(uuid, { name, img, uuid, ac: system?.attributes?.ac?.value });
	}
	return Array.from(targets.values());
}
