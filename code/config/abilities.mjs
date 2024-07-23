import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for abilities.
 *
 * @typedef {object} AbilityConfiguration
 * @property {string} abbreviation - Shortened version of the ability used for conversion from dnd5e & other features.
 * @property {object} labels
 * @property {string} labels.full - Localization key for the ability's full name.
 * @property {string} labels.abbreviation - Localization key for the ability's abbreviation.
 * @property {string} [type] - Type of ability (usually "physical" or "mental").
 * @property {string} [reference] - UUID of a journal entry with details on this ability.
 */

/**
 * The set of Abilities used within the system.
 * @enum {AbilityConfiguration}
 */
export const abilities = {
	strength: {
		abbreviation: "str",
		labels: {
			full: "BF.Ability.Strength.Label",
			abbreviation: "BF.Ability.Strength.Abbreviation"
		},
		type: "physical"
	},
	dexterity: {
		abbreviation: "dex",
		labels: {
			full: "BF.Ability.Dexterity.Label",
			abbreviation: "BF.Ability.Dexterity.Abbreviation"
		},
		type: "physical"
	},
	constitution: {
		abbreviation: "con",
		labels: {
			full: "BF.Ability.Constitution.Label",
			abbreviation: "BF.Ability.Constitution.Abbreviation"
		},
		type: "physical"
	},
	intelligence: {
		abbreviation: "int",
		labels: {
			full: "BF.Ability.Intelligence.Label",
			abbreviation: "BF.Ability.Intelligence.Abbreviation"
		},
		type: "mental"
	},
	wisdom: {
		abbreviation: "wis",
		labels: {
			full: "BF.Ability.Wisdom.Label",
			abbreviation: "BF.Ability.Wisdom.Abbreviation"
		},
		type: "mental"
	},
	charisma: {
		abbreviation: "cha",
		labels: {
			full: "BF.Ability.Charisma.Label",
			abbreviation: "BF.Ability.Charisma.Abbreviation"
		},
		type: "mental"
	}
};
localizeConfig(abilities, { labelKeyPath: "labels.full", sort: false });
localizeConfig(abilities, { labelKeyPath: "labels.abbreviation", propertyName: "localizedAbbreviations", sort: false });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for ability assignment methods.
 *
 * @typedef {object} AbilityAssignmentConfiguration
 * @property {string} abbreviation - Shortened version of the ability used for conversion from dnd5e & other features.
 * @property {object} labels
 * @property {string} labels.full - Localization key for the ability's full name.
 * @property {string} labels.abbreviation - Localization key for the ability's abbreviation.
 */

/**
 * Information on ability assignment.
 * @type {{
 *   methods: {[key: string]: AbilityAssignmentConfiguration},
 *   rolling: {{bonuses: number[], formula: string, max: number}},
 *   pointBuy: {points: number, costs: {[key: number]: number}}
 *   standardArray: {number[]}
 * }}
 */
export const abilityAssignment = {
	methods: {
		rolling: {
			label: "BF.AbilityAssignment.Method.Rolling.Label",
			hint: "BF.AbilityAssignment.Method.Rolling.Hint",
			icon: "systems/black-flag/artwork/interface/ability-assignment-rolling.svg"
		},
		"point-buy": {
			label: "BF.AbilityAssignment.Method.PointBuy.Label",
			hint: "BF.AbilityAssignment.Method.PointBuy.Hint",
			icon: "systems/black-flag/artwork/interface/ability-assignment-point-buy.svg"
		},
		"standard-array": {
			label: "BF.AbilityAssignment.Method.StandardArray.Label",
			hint: "BF.AbilityAssignment.Method.StandardArray.Hint",
			icon: "systems/black-flag/artwork/interface/ability-assignment-standard-array.svg"
		}
	},
	rolling: {
		bonuses: [2, 1],
		formula: "4d6dl",
		max: 18
	},
	pointBuy: {
		points: 32,
		costs: {
			8: 0,
			9: 1,
			10: 2,
			11: 3,
			12: 4,
			13: 5,
			14: 7,
			15: 9,
			16: 11,
			17: 13,
			18: 16
		}
	},
	standardArray: [16, 14, 14, 13, 10, 8]
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Default abilities used throughout the system.
 * @enum {string}
 */
export const defaultAbilities = {
	armor: "dexterity",
	hitPoints: "constitution",
	initiative: "dexterity",
	meleeAttack: "strength",
	rangedAttack: "dexterity"
};
