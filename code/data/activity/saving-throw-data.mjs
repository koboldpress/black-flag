import { simplifyBonus } from "../../utils/_module.mjs";
import { DamageField, FormulaField } from "../fields/_module.mjs";
import BaseActivity from "./base-activity.mjs";

const { ArrayField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the saving throw activity.
 */
export class SavingThrowData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new StringField({
				initial: () => Object.keys(CONFIG.BlackFlag.abilities)[0],
				label: "BF.Activity.SavingThrow.OpposedAbility.Label"
			}),
			damage: new SchemaField(
				{
					parts: new ArrayField(new DamageField())
				},
				{ label: "BF.Damage.Label" }
			),
			// TODO: Add conditions that can be imposed
			dc: new SchemaField(
				{
					ability: new StringField({ label: "BF.DifficultyClass.Ability.Label" }),
					formula: new FormulaField({ deterministic: true, label: "BF.DifficultyClass.Formula.Label" })
				},
				{ label: "BF.DifficultyClass.Label" }
			)
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
		if (this.parent.isSpell) return game.i18n.localize("BF.Spellcasting.Label");
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		if (foundry.utils.getType(source.damage?.parts) === "Array") {
			source.damage.parts.forEach(p => BaseActivity._migrateCustomDamageFormula(p));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		if (!this.parent.isSpell && !this.dc.ability) this.dc.ability = "custom";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		let dc;
		const rollData = this.parent.item.getRollData({ deterministic: true });
		if (this.dc.ability === "custom") dc = simplifyBonus(this.dc.formula, rollData);
		else if (this.parent.actor?.system.spellcasting?.dc && !this.dc.ability) {
			dc = this.parent.actor.system.spellcasting.dc;
		} else dc = rollData.abilities?.[this.parent.dcAbility]?.dc;
		if (dc)
			Object.defineProperty(this.dc, "final", {
				value: dc,
				configurable: true,
				enumerable: false
			});
	}
}
