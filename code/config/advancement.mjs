import * as sheets from "../applications/advancement/_module.mjs";
import { scaleValue } from "../data/advancement/_module.mjs";
import * as advancement from "../documents/advancement/_module.mjs";

/**
 * Configuration data for advancement types.
 *
 * @typedef {object} AdvancementTypeConfig
 * @property {typeof Advancement} type - Advancement type represented.
 * @property {Set<string>} validItemTypes - Types to which this advancement can be added.
 * @property {boolean} [hidden] - Should this advancement be hidden in the selection dialog? Hidden advancement types
 *                                can be created programmatically but not manually by users.
 */

const _ALL_ITEM_TYPES = ["background", "class", "feature", "heritage", "lineage", "subclass", "talent"];

/**
 * Advancement types that can be added to items.
 * @enum {AdvancementTypeConfig}
 */
export const _advancementTypes = {
	base: {
		documentClass: advancement.Advancement,
		validItemTypes: new Set(),
		sheetClasses: {
			config: sheets.AdvancementConfig,
			flow: sheets.AdvancementFlow
		}
	},
	chooseFeatures: {
		documentClass: advancement.ChooseFeaturesAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES),
		sheetClasses: {
			config: sheets.ChooseFeaturesConfig,
			flow: sheets.ChooseFeaturesFlow
		}
	},
	chooseSpells: {
		documentClass: advancement.ChooseSpellsAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES),
		sheetClasses: {
			config: sheets.ChooseSpellsConfig,
			flow: sheets.ChooseSpellsFlow
		}
	},
	expandedTalentList: {
		documentClass: advancement.ExpandedTalentListAdvancement,
		validItemTypes: new Set(["subclass"]),
		sheetClasses: {
			config: sheets.ImprovementConfig
		}
	},
	grantFeatures: {
		documentClass: advancement.GrantFeaturesAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES),
		sheetClasses: {
			config: sheets.GrantFeaturesConfig
		}
	},
	grantSpells: {
		documentClass: advancement.GrantSpellsAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES),
		sheetClasses: {
			config: sheets.GrantSpellsConfig,
			flow: sheets.GrantSpellsFlow
		}
	},
	hitPoints: {
		documentClass: advancement.HitPointsAdvancement,
		validItemTypes: new Set(["class"]),
		sheetClasses: {
			config: sheets.HitPointsConfig,
			flow: sheets.HitPointsFlow
		}
	},
	improvement: {
		documentClass: advancement.ImprovementAdvancement,
		validItemTypes: new Set(["class"]),
		sheetClasses: {
			config: sheets.ImprovementConfig,
			flow: sheets.ImprovementFlow
		}
	},
	keyAbility: {
		documentClass: advancement.KeyAbilityAdvancement,
		validItemTypes: new Set(["class"]),
		sheetClasses: {
			config: sheets.KeyAbilityConfig,
			flow: sheets.KeyAbilityFlow
		}
	},
	property: {
		documentClass: advancement.PropertyAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES),
		sheetClasses: {
			config: sheets.PropertyConfig
		}
	},
	scaleValue: {
		documentClass: advancement.ScaleValueAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES),
		sheetClasses: {
			config: sheets.ScaleValueConfig
		},
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
		validItemTypes: new Set(["lineage"]),
		sheetClasses: {
			config: sheets.SizeConfig,
			flow: sheets.SizeFlow
		}
	},
	spellcasting: {
		documentClass: advancement.SpellcastingAdvancement,
		validItemTypes: new Set(["class", "subclass"]),
		sheetClasses: {
			config: sheets.SpellcastingConfig
		}
	},
	spellcastingValue: {
		documentClass: advancement.SpellcastingValueAdvancement,
		validItemTypes: new Set(["class", "subclass"]),
		sheetClasses: {
			config: sheets.SpellcastingValueConfig
		},
		hidden: true
	},
	trait: {
		documentClass: advancement.TraitAdvancement,
		validItemTypes: new Set(_ALL_ITEM_TYPES),
		sheetClasses: {
			config: sheets.TraitConfig,
			flow: sheets.TraitFlow
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Number of experience points requires to gain a specific level. Array indices correspond with level.
 * @type {number[]}
 */
export const experiencePoints = [
	,
	0, // Level 1
	300, // Level 2
	900, // Level 3
	2700, // Level 4
	6500, // Level 5
	14000, // Level 6
	23000, // Level 7
	34000, // Level 8
	48000, // Level 9
	64000, // Level 10
	85000, // Level 11
	100000, // Level 12
	120000, // Level 13
	140000, // Level 14
	165000, // Level 15
	195000, // Level 16
	225000, // Level 17
	265000, // Level 18
	305000, // Level 19
	355000 // Level 20
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
export const maxLevel = 20;

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Ability score threshold required to multiclass.
 * @type {number}
 */
export const multiclassingAbilityThreshold = 13;

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

/**
 * Levels at which subclasses grant features by default.
 * @type {number[]}
 */
export const subclassFeatureLevels = [3, 7, 11, 15];

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
