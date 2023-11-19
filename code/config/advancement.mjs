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
		documentClass: advancement.ChooseFeaturesAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES)
	},
	expandedTalentList: {
		documentClass: advancement.ExpandedTalentListAdvancement,
		validItemTypes: new Set(["subclass"])
	},
	grantFeatures: {
		documentClass: advancement.GrantFeaturesAdvancement,
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
		validItemTypes: new Set(_ALL_ITEM_TYPES),
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
 * Number of experience points requires to gain a specific level. Array indices correspond with level.
 * @type {number[]}
 */
export const experiencePoints = [
	,
	0,       // Level 1
	300,     // Level 2
	900,     // Level 3
	2700,    // Level 4
	6500,    // Level 5
	14000,   // Level 6
	23000,   // Level 7
	34000,   // Level 8
	48000,   // Level 9
	64000,   // Level 10
	85000,   // Level 11
	100000,  // Level 12
	120000,  // Level 13
	140000,  // Level 14
	165000,  // Level 15
	195000,  // Level 16
	225000,  // Level 17
	265000,  // Level 18
	305000,  // Level 19
	355000   // Level 20
];

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
