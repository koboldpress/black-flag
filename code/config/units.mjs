import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration for system various units.
 *
 * @typedef {object} UnitConfiguration
 * @property {string} localization - Pluralizable localization key.
 * @property {string} abbreviation - Abbreviation of the weight.
 * @property {number} conversion - Multiplier used to convert between various weights.
 */

/**
 * Currency denominations that can be used.
 * @enum {UnitConfiguration}
 */
export const currencies = {
	pp: {
		localization: "BF.Currency.Denomination.Platinum.Label",
		abbreviation: "BF.Currency.Denomination.Platinum.Abbreviation",
		conversion: 0.1
	},
	gp: {
		localization: "BF.Currency.Denomination.Gold.Label",
		abbreviation: "BF.Currency.Denomination.Gold.Abbreviation",
		conversion: 1
	},
	ep: {
		localization: "BF.Currency.Denomination.Electrum.Label",
		abbreviation: "BF.Currency.Denomination.Electrum.Abbreviation",
		conversion: 1
	},
	sp: {
		localization: "BF.Currency.Denomination.Silver.Label",
		abbreviation: "BF.Currency.Denomination.Silver.Abbreviation",
		conversion: 10
	},
	cp: {
		localization: "BF.Currency.Denomination.Copper.Label",
		abbreviation: "BF.Currency.Denomination.Copper.Abbreviation",
		conversion: 1100
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Units that can be used for measuring distances.
 * @enum {UnitConfiguration}
 */
export const distanceUnits = {
	foot: {
		localization: "BF.Distance.Unit.Foot.Label",
		abbreviation: "BF.Distance.Unit.Foot.Abbreviation",
		formattingUnit: "foot",
		conversion: 1
	},
	mile: {
		localization: "BF.Distance.Unit.Mile.Label",
		abbreviation: "BF.Distance.Unit.Mile.Abbreviation",
		formattingUnit: "mile",
		conversion: 1 / 5280
	}
};
localizeConfig(distanceUnits, { pluralRule: "other" });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Time periods usable by the system, split into combat periods and otherwise.
 * @type {{
 *   combat: {[key: string]: LabeledConfiguration},
 *   clock: {[key: string]: LabeledConfiguration}
 * }}
 */
export const timeUnits = {
	combat: {
		label: "BF.Time.Category.Combat.Label",
		children: {
			turn: {
				localization: "BF.Time.Unit.Turn.Label"
			},
			round: {
				localization: "BF.Time.Unit.Round.Label"
			},
			encounter: {
				localization: "BF.Time.Unit.Encounter.Label"
			}
		}
	},
	time: {
		label: "BF.Time.Category.Time.Label",
		children: {
			minute: {
				localization: "BF.Time.Unit.Minute.Label"
			},
			hour: {
				localization: "BF.Time.Unit.Hour.Label"
			},
			day: {
				localization: "BF.Time.Unit.Day.Label"
			},
			month: {
				localization: "BF.Time.Unit.Month.Label"
			},
			year: {
				localization: "BF.Time.Unit.Year.Label"
			}
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Units that can represent weight in the system.
 * @enum {UnitConfiguration}
 */
export const weightUnits = {
	pound: {
		localization: "BF.Weight.Unit.Pound.Label",
		abbreviation: "BF.Weight.Unit.Pound.Abbreviation",
		conversion: 1
	}
};
localizeConfig(weightUnits, { pluralRule: "other" });
