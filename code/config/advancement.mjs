import * as advancement from "../documents/advancement/_module.mjs";

/**
 * Configuration data for advancement types.
 *
 * @typedef {object} AdvancementTypeConfig
 * @property {typeof Advancement} type - Advancement type represented.
 * @property {Set<string>} validItemTypes - Types to which this advancement can be added.
 */

/**
 * Advancement types that can be added to items.
 * @enum {AdvancementTypeConfig}
 */
export const _advancementTypes = {
	chooseFeatures: {
		documentClass: advancement.ChooseFeatures,
		validItemTypes: new Set(["background", "class", "heritage", "lineage"])
	},
	grantFeatures: {
		documentClass: advancement.GrantFeatures,
		validItemTypes: new Set(["background", "class", "heritage", "lineage"])
	},
	hitPoints: {
		documentClass: advancement.HitPointsAdvancement,
		validItemTypes: new Set(["class"])
	},
	size: {
		documentClass: advancement.SizeAdvancement,
		validItemTypes: new Set(["lineage"])
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Valid die sizes for hit dices.
 * @type {number[]}
 */
export const hitDieSizes = [4, 6, 8, 10, 12];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Maximum character level.
 * @type {number}
 */
export const maxLevel = 5;
