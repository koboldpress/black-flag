import { simplifyBonus } from "../../utils/_module.mjs";
import ActivityDataModel from "../abstract/activity-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField, BooleanField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the check activity.
 *
 * @property {object} check
 * @property {string} check.ability - Ability used with the check.
 * @property {Set<string>} check.associated - Skills, tools, or vehicles that can contribute to the check.
 * @property {object} check.dc
 * @property {string} check.dc.calculation - Method or ability used to calculate the difficulty class of the check.
 * @property {string} check.dc.formula - Custom DC formula or flat value.
 * @property {boolean} check.visible - Should the check rolls be visible to all players?
 * @property {EffectApplicationData[]} effects - Effects to be applied.
 */
export class CheckData extends ActivityDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.CHECK"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			check: new SchemaField({
				ability: new StringField(),
				associated: new SetField(new StringField()),
				dc: new SchemaField({
					calculation: new StringField(),
					formula: new FormulaField({ deterministic: true })
				}),
				visible: new BooleanField({ initial: true })
			}),
			effects: new ArrayField(new AppliedEffectField())
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
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		const rollData = this.getRollData({ deterministic: true });
		super.prepareFinalData();

		if (this.check.ability === "spellcasting") this.check.ability = this.spellcastingAbility;

		let ability;
		if (this.check.dc.calculation) ability = this.ability;
		else this.check.dc.value = simplifyBonus(this.check.dc.formula, rollData);
		if (ability)
			this.check.dc.value =
				this.actor?.system.abilities?.[ability]?.dc ?? 8 + (this.actor?.system.attributes?.prof ?? 0);

		if (!this.check.dc.value) this.check.dc.value = null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the ability to use with an associated value.
	 * @param {string} associated - Skill, tool, or vehicle key.
	 * @returns {string|null} - Ability to use, if found.
	 */
	getAbility(associated) {
		if (this.check.ability) return this.check.ability;
		const source =
			this.actor?.system.proficiencies?.skills?.[associated] ??
			this.actor?.system.proficiencies?.tools?.[associated] ??
			this.actor?.system.proficiencies?.vehicles?.[associated];
		if (source?.ability) return source?.ability;
		if (associated in CONFIG.BlackFlag.skills) return CONFIG.BlackFlag.skills[associated].ability;
		return null;
	}
}
