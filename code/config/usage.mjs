import { localizeConfig } from "../utils/_module.mjs";
import { hitDieSizes } from "./advancement.mjs";
import { spellRings } from "./spellcasting.mjs";

/**
 * Types of resource consumption that can be used on activities.
 * @enum {LabeledConfiguration}
 */
export const consumptionTypes = {
	activity: {
		label: "BF.Consumption.Type.ActivityUses.Label"
	},
	item: {
		label: "BF.Consumption.Type.ItemUses.Label",
		validTargets: activity => {
			const otherItems = activity.item.actor?.items
				.filter(i => (i.system.uses?.min || i.system.uses?.max) && i !== activity.item)
				.map(i => ({key: i.id, label: i.name}));
			return [{key: "", label: game.i18n.localize("BF.Consumption.Type.ItemUses.ThisItem")}, ...(otherItems ?? [])];
		}
	},
	hitDice: {
		label: "BF.Consumption.Type.HitDice.Label",
		validTargets: activity => [
			{key: "smallest", label: game.i18n.localize("BF.Consumption.Type.HitDice.Smallest")},
			...hitDieSizes.map(d => ({key: d, label: `d${d}`})),
			{key: "largest", label: game.i18n.localize("BF.Consumption.Type.HitDice.Largest")}
		]
	},
	spellSlots: {
		label: "BF.Consumption.Type.SpellSlots.Label",
		validTargets: activity => {
			const rings = spellRings();
			delete rings[0];
			return Object.entries(rings).map(([key, label]) => ({key, label}));
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

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
