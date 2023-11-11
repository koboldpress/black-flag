import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for item usage recovery periods.
 *
 * @typedef {AbbreviatedConfiguration} RecoveryPeriodConfiguration
 * @property {boolean} [combatOnly=false] - Is this period only consumed during a combat encounter?
 */

/**
 * At what point are an item's resources recovered?
 * @enum {RecoveryPeriodConfiguration}
 */
export const recoveryPeriods = {
	turn: {
		label: "BF.Recovery.Period.Turn.Label",
		abbreviation: "BF.Recovery.Period.Turn.Label",
		combatOnly: true
	},
	round: {
		label: "BF.Recovery.Period.Round.Label",
		abbreviation: "BF.Recovery.Period.Round.Label",
		combatOnly: true
	},
	encounter: {
		label: "BF.Recovery.Period.Encounter.Label",
		abbreviation: "BF.Recovery.Period.Encounter.Label",
		combatOnly: true
	},
	sr: {
		label: "BF.Rest.Type.Short.Label",
		abbreviation: "BF.Rest.Type.Short.Abbreviation"
	},
	lr: {
		label: "BF.Rest.Type.Long.Label",
		abbreviation: "BF.Rest.Type.Long.Abbreviation"
	}
};
localizeConfig(recoveryPeriods, { labelKeyPath: "label", sort: false });
localizeConfig(recoveryPeriods, { labelKeyPath: "abbreviation", propertyName: "localizedAbbreviations", sort: false });
