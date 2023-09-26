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
	keyAbility: {
		documentClass: advancement.KeyAbilityAdvancement,
		validItemTypes: new Set(["class"])
	},
	property: {
		documentClass: advancement.PropertyAdvancement,
		validItemTypes: new Set(["background", "class", "heritage", "lineage"])
	},
	size: {
		documentClass: advancement.SizeAdvancement,
		validItemTypes: new Set(["lineage"])
	},
	trait: {
		documentClass: advancement.TraitAdvancement,
		validItemTypes: new Set(["background", "class", "heritage", "lineage"])
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

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Modes used within a trait advancement.
 * @enum {LabeledConfiguration}
 */
export const traitModes = {
	default: {
		label: "BF.Advancement.Trait.Mode.Default.Label",
		hint: "BF.Advancement.Trait.Mode.Default.Hint"
	},
	expertise: {
		label: "BF.Advancement.Trait.Mode.Expertise.Label",
		hint: "BF.Advancement.Trait.Mode.Expertise.Hint"
	},
	forcedExpertise: {
		label: "BF.Advancement.Trait.Mode.Force.Label",
		hint: "BF.Advancement.Trait.Mode.Force.Hint"
	},
	upgrade: {
		label: "BF.Advancement.Trait.Mode.Upgrade.Label",
		hint: "BF.Advancement.Trait.Mode.Upgrade.Hint"
	}
};
