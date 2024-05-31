import { localizeConfig } from "../utils/_module.mjs";
import { hitDieSizes } from "./advancement.mjs";
import { spellCircles } from "./spellcasting.mjs";

/**
 * Configuration information for activity consumption types.
 *
 * @typedef {LabeledConfiguration} ConsumptionTypeConfiguration
 * @property {ConsumptionConsumeFunction|string} consume - Function used to calculate updates upon consumption.
 * @property {boolean} [targetRequiresEmbedded] - Display text input rather than limited options when not embedded.
 * @property {ConsumptionValidTargetsFunction} [validTargets] - Function used to build list of targets for this type.
 */

/**
 * Function called to calculate consumption changes. Should throw an error if consumption is not possible.
 *
 * @callback ConsumptionConsumeFunction
 * @param {Activity} activity - Activity being activated.
 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
 * @param {ConsumptionTargetData} target - Configuration info for this consumption target.
 * @param {ActivationUpdates} updates - Updates to be performed.
 */

/**
 * Function called to calculate consumption changes.
 *
 * @callback ConsumptionValidTargetsFunction
 * @param {Activity} activity - Activity to which the consumption belongs.
 * @returns {{key: string, label: string}[]} - Valid targets.
 */

/**
 * Types of resource consumption that can be used on activities.
 * @enum {ConsumptionTypeConfiguration}
 */
export const consumptionTypes = {
	activity: {
		label: "BF.Consumption.Type.ActivityUses.Label",
		prompt: "BF.Consumption.Type.ActivityUses.Prompt",
		consume: "consumeActivity"
	},
	item: {
		label: "BF.Consumption.Type.ItemUses.Label",
		prompt: "BF.Consumption.Type.ItemUses.Prompt",
		consume: "consumeItem",
		targetRequiresEmbedded: true,
		validTargets: activity => {
			const otherItems = activity.item.actor?.items
				.filter(i => (i.system.uses?.min || i.system.uses?.max) && i !== activity.item)
				.map(i => ({ key: i.id, label: i.name }));
			return [{ key: "", label: game.i18n.localize("BF.Consumption.Type.ItemUses.ThisItem") }, ...(otherItems ?? [])];
		}
	},
	hitDice: {
		label: "BF.Consumption.Type.HitDice.Label",
		prompt: "BF.Consumption.Type.HitDice.Prompt",
		consume: "consumeHitDice",
		validTargets: activity => [
			{ key: "smallest", label: game.i18n.localize("BF.Consumption.Type.HitDice.Smallest") },
			...hitDieSizes.map(d => ({ key: d, label: `d${d}` })),
			{ key: "largest", label: game.i18n.localize("BF.Consumption.Type.HitDice.Largest") }
		]
	},
	spellSlots: {
		label: "BF.Consumption.Type.SpellSlots.Label",
		prompt: "BF.Consumption.Type.SpellSlots.Prompt",
		consume: "consumeSpellSlots",
		validTargets: activity => {
			const circles = spellCircles();
			delete circles[0];
			return Object.entries(circles).map(([key, label]) => ({ key, label }));
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for item usage recovery periods.
 *
 * @typedef {AbbreviatedConfiguration} RecoveryPeriodConfiguration
 * @property {string} [npcLabel] - Optional alternative label used to display recovery period on NPC sheets.
 * @property {boolean} [combatOnly=false] - Is this period only consumed during a combat encounter?
 */

/**
 * At what point are an item's resources recovered?
 * @enum {RecoveryPeriodConfiguration}
 */
export const recoveryPeriods = {
	longRest: {
		label: "BF.Rest.Type.Long.Label",
		npcLabel: "BF.Time.Unit.Day.Label[one]",
		abbreviation: "BF.Rest.Type.Long.Abbreviation"
	},
	shortRest: {
		label: "BF.Rest.Type.Short.Label",
		abbreviation: "BF.Rest.Type.Short.Abbreviation"
	},
	encounter: {
		label: "BF.Recovery.Period.Encounter.Label",
		abbreviation: "BF.Recovery.Period.Encounter.Label",
		combatOnly: true
	},
	round: {
		label: "BF.Recovery.Period.Round.Label",
		abbreviation: "BF.Recovery.Period.Round.Label",
		combatOnly: true
	},
	turn: {
		label: "BF.Recovery.Period.Turn.Label",
		abbreviation: "BF.Recovery.Period.Turn.Label",
		combatOnly: true
	}
};
localizeConfig(recoveryPeriods, { labelKeyPath: "label", sort: false });
localizeConfig(recoveryPeriods, { labelKeyPath: "abbreviation", propertyName: "localizedAbbreviations", sort: false });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Types of usage recovery.
 * @enum {LabeledConfiguration}
 */
export const recoveryTypes = {
	recoverAll: {
		label: "BF.Recovery.Type.RecoverAll"
	},
	loseAll: {
		label: "BF.Recovery.Type.LoseAll"
	},
	formula: {
		label: "BF.Recovery.Type.Formula"
	}
};
