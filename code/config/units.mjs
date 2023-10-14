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
