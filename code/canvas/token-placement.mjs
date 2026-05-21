import BasePlacement from "./api/base-placement.mjs";

/**
 * @typedef {BasePlacementConfiguration} TokenPlacementConfiguration
 * @property {TokenDocument} [origin] - Token that is the origin point of the placement.
 * @property {PrototypeToken[]} tokens - Prototype token information for rendering.
 */

/**
 * @typedef TokenPlacementData
 * @property {PrototypeToken} prototypeToken
 * @property {object} index
 * @property {number} index.total - Index of the placement across all placements.
 * @property {number} index.unique - Index of the placement across placements with the same original token.
 * @property {number} x
 * @property {number} y
 * @property {number} elevation
 * @property {number} rotation
 */

/**
 * Class responsible for placing one or more tokens onto the scene.
 * @extends BasePlacement<TokenPlacementConfiguration, TokenPlacementData>
 */
export default class TokenPlacement extends BasePlacement {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Placement              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _place() {
		const results = [];
		const uniqueTokens = new Map();
		await canvas.tokens.placeTokens(
			this.config.tokens.map(t => t.toObject()),
			{
				create: false,
				preConfirm: ({ document: doc, index }) => {
					const actorId = this.config.tokens[index].parent.id;
					uniqueTokens.set(actorId, (uniqueTokens.get(actorId) ?? -1) + 1);
					results.push({
						x: doc.x,
						y: doc.y,
						elevation: doc.elevation,
						rotation: doc.rotation,
						prototypeToken: this.config.tokens[index],
						index: { total: index, unique: uniqueTokens.get(actorId) }
					});
				}
			}
		);
		return results;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Adjust the appended number on an unlinked token to account for multiple placements.
	 * @param {BlackFlagTokenDocument|object} tokenDocument - Document or data object to adjust.
	 * @param {PlacementData} placement - Placement data associated with this token document.
	 */
	static adjustAppendedNumber(tokenDocument, placement) {
		const regex = new RegExp(/\((\d+)\)$/);
		const match = tokenDocument.name?.match(regex);
		if (!match) return;
		const name = tokenDocument.name.replace(regex, `(${Number(match[1]) + placement.index.unique})`);
		if (tokenDocument instanceof TokenDocument) tokenDocument.updateSource({ name });
		else tokenDocument.name = name;
	}
}
