import { ConsumptionTargetData } from "../data/activity/fields/consumption-targets-field.mjs";
import { localizeConfig } from "../utils/_module.mjs";

/**
 * List of attribute key paths that can be consumed by Actor type. Auto-populated during the setup stage.
 * @enum {string[]}
 */
export const consumableResources = [];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration information for activity consumption types.
 *
 * @typedef {LabeledConfiguration} ConsumptionTypeConfiguration
 * @property {ConsumptionConsumeFunction} consume               Function used to consume according to this type.
 * @property {ConsumptionLabelsFunction} consumptionLabels      Function used to generate a hint of consumption amount.
 * @property {LabeledConfiguration} [scalingModes] - Consumption parts that can be scaled.
 * @property {boolean} [targetRequiresEmbedded] - Display text input rather than limited options when not embedded.
 * @property {ConsumptionValidTargetsFunction} [validTargets] - Function used to build list of targets for this type.
 */

/**
 * @callback ConsumptionConsumeFunction
 * @this {ConsumptionTargetData}
 * @param {ActivityUseConfiguration} config - Configuration data for the activity usage.
 * @param {ActivityUsageUpdates} updates - Updates to be performed.
 * @throws ConsumptionError
 */

/**
 * @callback ConsumptionLabelsFunction
 * @this {ConsumptionTargetData}
 * @param {ActivityUseConfiguration} config - Configuration data for the activity usage.
 * @param {boolean} consumed - Is this consumption currently set to be consumed?
 * @returns {ConsumptionLabels}
 */

/**
 * @callback ConsumptionValidTargetsFunction
 * @this {ConsumptionTargetData}
 * @returns {FormSelectOption[]} - Valid targets.
 */

/**
 * Types of resource consumption that can be used on activities.
 * @enum {ConsumptionTypeConfiguration}
 */
export const consumptionTypes = {
	activity: {
		label: "BF.CONSUMPTION.Type.ActivityUses.Label",
		prompt: "BF.CONSUMPTION.Type.ActivityUses.Prompt",
		consume: ConsumptionTargetData.consumeActivityUses,
		consumptionLabels: ConsumptionTargetData.consumptionLabelsActivityUses
	},
	item: {
		label: "BF.CONSUMPTION.Type.ItemUses.Label",
		prompt: "BF.CONSUMPTION.Type.ItemUses.Prompt",
		consume: ConsumptionTargetData.consumeItemUses,
		consumptionLabels: ConsumptionTargetData.consumptionLabelsItemUses,
		targetRequiresEmbedded: true,
		validTargets: ConsumptionTargetData.validItemUsesTargets
	},
	attribute: {
		label: "BF.CONSUMPTION.Type.Attribute.Label",
		prompt: "BF.CONSUMPTION.Type.Attribute.Prompt",
		consume: ConsumptionTargetData.consumeAttribute,
		consumptionLabels: ConsumptionTargetData.consumptionLabelsAttribute,
		validTargets: ConsumptionTargetData.validAttributeTargets
	},
	hitDice: {
		label: "BF.CONSUMPTION.Type.HitDice.Label",
		prompt: "BF.CONSUMPTION.Type.HitDice.Prompt",
		consume: ConsumptionTargetData.consumeHitDice,
		consumptionLabels: ConsumptionTargetData.consumptionLabelsHitDice,
		validTargets: ConsumptionTargetData.validHitDiceTargets
	},
	spellSlots: {
		label: "BF.CONSUMPTION.Type.SpellSlots.Label",
		prompt: "BF.CONSUMPTION.Type.SpellSlots.Prompt",
		consume: ConsumptionTargetData.consumeSpellSlots,
		consumptionLabels: ConsumptionTargetData.consumptionLabelsSpellSlots,
		scalingModes: {
			circle: {
				label: "BF.Consumption.Scaling.Mode.Circle"
			}
		},
		validTargets: ConsumptionTargetData.validSpellSlotsTargets
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for item usage recovery periods.
 *
 * @typedef {AbbreviatedConfiguration} RecoveryPeriodConfiguration
 * @property {string} [npcLabel] - Optional alternative label used to display recovery period on NPC sheets.
 * @property {boolean} [combatOnly=false] - Is this period only consumed during a combat encounter?
 * @property {string} [group] - Localizable label for the group.
 */

/**
 * At what point are an item's resources recovered?
 * @enum {RecoveryPeriodConfiguration}
 */
export const recoveryPeriods = {
	longRest: {
		label: "BF.Rest.Type.Long.Label",
		npcLabel: "BF.Time.Unit.Day.Label[one]",
		abbreviation: "BF.Rest.Type.Long.Abbreviation",
		group: "BF.Recovery.Group.Rest"
	},
	shortRest: {
		label: "BF.Rest.Type.Short.Label",
		abbreviation: "BF.Rest.Type.Short.Abbreviation",
		group: "BF.Recovery.Group.Rest"
	},
	encounter: {
		label: "BF.Recovery.Period.Encounter",
		abbreviation: "BF.Recovery.Period.Encounter",
		combatOnly: true,
		group: "BF.Recovery.Group.Combat"
	},
	round: {
		label: "BF.Recovery.Period.Round",
		abbreviation: "BF.Recovery.Period.Round",
		combatOnly: true,
		group: "BF.Recovery.Group.Combat"
	},
	turn: {
		label: "BF.Recovery.Period.Turn",
		abbreviation: "BF.Recovery.Period.Turn",
		combatOnly: true,
		group: "BF.Recovery.Group.Combat"
	},
	day: {
		label: "BF.Recovery.Period.Day",
		abbreviation: "BF.Recovery.Period.Day",
		group: "BF.Recovery.Group.Time"
	},
	dawn: {
		label: "BF.Recovery.Period.Dawn",
		abbreviation: "BF.Recovery.Period.Dawn",
		group: "BF.Recovery.Group.Time"
	},
	dusk: {
		label: "BF.Recovery.Period.Dusk",
		abbreviation: "BF.Recovery.Period.Dusk",
		group: "BF.Recovery.Group.Time"
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
