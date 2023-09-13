/**
 * Configuration data for abilities.
 *
 * @typedef {object} AbilityConfiguration
 * @property {string} abbreviation - Shortened version of the ability used for conversion from dnd5e & other features.
 * @property {object} labels
 * @property {string} labels.full - Localization key for the ability's full name.
 * @property {string} labels.abbreviation - Localization key for the ability's abbreviation.
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
		}
	},
	dexterity: {
		abbreviation: "dex",
		labels: {
			full: "BF.Ability.Dexterity.Label",
			abbreviation: "BF.Ability.Dexterity.Abbreviation"
		}
	},
	constitution: {
		abbreviation: "con",
		labels: {
			full: "BF.Ability.Constitution.Label",
			abbreviation: "BF.Ability.Constitution.Abbreviation"
		}
	},
	intelligence: {
		abbreviation: "int",
		labels: {
			full: "BF.Ability.Intelligence.Label",
			abbreviation: "BF.Ability.Intelligence.Abbreviation"
		}
	},
	wisdom: {
		abbreviation: "wis",
		labels: {
			full: "BF.Ability.Wisdom.Label",
			abbreviation: "BF.Ability.Wisdom.Abbreviation"
		}
	},
	charisma: {
		abbreviation: "cha",
		labels: {
			full: "BF.Ability.Charisma.Label",
			abbreviation: "BF.Ability.Charisma.Abbreviation"
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> */

/**
 * Ability scoring methods.
 * @enum {object}
 */
export const abilityAssignmentMethods = {
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
};

/* <><><><> <><><><> <><><><> <><><><> */

/**
 * Ability rolling information including bonuses applied, formula used for rolls, and max starting ability score.
 * @type {{bonuses: number[], formula: string, max: number}}
 */
export const abilityRolling = {
	bonuses: [2, 1],
	formula: "4d6dl",
	max: 18
};

/* <><><><> <><><><> <><><><> <><><><> */

/**
 * Cost to increase an ability using the Point Buy scoring method.
 * @enum {{points: number, costs: {[key: number]: number}}}
 */
export const pointBuy = {
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
};

/* <><><><> <><><><> <><><><> <><><><> */

/**
 * Ability scores offered when using the Standard Array scoring method.
 * @type {number[]}
 */
export const standardArray = [16, 14, 14, 13, 10, 8];
