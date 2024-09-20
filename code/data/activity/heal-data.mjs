import ActivityDataModel from "../abstract/activity-data-model.mjs";
import { DamageField } from "../fields/_module.mjs";
import BaseActivity from "./base-activity.mjs";
import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField } = foundry.data.fields;

/**
 * Configuration data for the Heal activity.
 * @property {EffectApplicationData[]} effects - Effects to be applied.
 * @property {ExtendedDamageData} healing - Healing value.
 */
export class HealData extends ActivityDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.HEAL"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			effects: new ArrayField(new AppliedEffectField()),
			healing: new DamageField({ initial: { type: "normal" } })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return a string describing the result if the default ability is selected for this activity.
	 * @type {string|null}
	 */
	get defaultAbility() {
		if (this.isSpell) return game.i18n.localize("BF.Spellcasting.Label");
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		if ("healing" in source) BaseActivity._migrateCustomDamageFormula(source.healing);
	}
}
