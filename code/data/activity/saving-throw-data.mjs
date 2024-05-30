import { simplifyBonus } from "../../utils/_module.mjs";
import { DamageField, FormulaField } from "../fields/_module.mjs";

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
		if (this.parent.actor?.system.spellcasting?.dc && !this.dc.ability) {
			dc = this.parent.actor.system.spellcasting.dc;
		} else {
			const rollData = this.parent.item.getRollData({ deterministic: true });
			const ability = rollData.abilities?.[this.parent.dcAbility];
			if (ability) {
				rollData.mod = ability.mod;
				dc = this.dc.ability === "custom" ? simplifyBonus(this.dc.formula, rollData) : ability?.dc;
			}
		}
		if (dc)
			Object.defineProperty(this.dc, "final", {
				value: dc,
				configurable: true,
				enumerable: false
			});
	}
}
