import { scaleValue } from "../data/advancement/_module.mjs";
import * as advancement from "../documents/advancement/_module.mjs";

/**
 * Configuration data for advancement types.
 *
 * @typedef {object} AdvancementTypeConfig
 * @property {typeof Advancement} type - Advancement type represented.
 * @property {Set<string>} validItemTypes - Types to which this advancement can be added.
 */

const _ALL_ITEM_TYPES = ["background", "class", "feature", "heritage", "lineage", "subclass", "talent"];

/**
 * Advancement types that can be added to items.
 * @enum {AdvancementTypeConfig}
 */
export const _advancementTypes = {
	chooseFeatures: {
		documentClass: advancement.ChooseFeatures,
		validItemTypes: new Set(_ALL_ITEM_TYPES)
	},
	grantFeatures: {
		documentClass: advancement.GrantFeatures,
		validItemTypes: new Set(_ALL_ITEM_TYPES)
	},
	hitPoints: {
		documentClass: advancement.HitPointsAdvancement,
		validItemTypes: new Set(["class"])
	},
	improvement: {
		documentClass: advancement.ImprovementAdvancement,
		validItemTypes: new Set(["class"])
	},
	keyAbility: {
		documentClass: advancement.KeyAbilityAdvancement,
		validItemTypes: new Set(["class"])
	},
	property: {
		documentClass: advancement.PropertyAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES)
	},
	scaleValue: {
		documentClass: advancement.ScaleValueAdvancement,
		validItemTypes: new Set(["background", "class", "heritage", "lineage", "subclass"]),
		dataTypes: {
			string: scaleValue.ScaleTypeString,
			cr: scaleValue.ScaleTypeCR,
			dice: scaleValue.ScaleTypeDice,
			distance: scaleValue.ScaleTypeDistance,
			number: scaleValue.ScaleTypeNumber,
			usage: scaleValue.ScaleTypeUsage
		}
	},
	size: {
		documentClass: advancement.SizeAdvancement,
		validItemTypes: new Set(["lineage"])
	},
	spellcasting: {
		documentClass: advancement.SpellcastingAdvancement,
		validItemTypes: new Set(["class", "subclass"])
	},
	trait: {
		documentClass: advancement.TraitAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES)
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
 * List of die faces that can be chosen within a dice Scale Value.
 * @type {number[]}
 */
export const scaleDiceSizes = [2, 3, 4, 6, 8, 10, 12, 20, 100];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Level at which classes grant subclasses.
 * @type {number}
 */
export const subclassLevel = 3;

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
