import { simplifyBonus } from "../../utils/_module.mjs";
import { DamageField, FormulaField } from "../fields/_module.mjs";
import BaseActivity from "./base-activity.mjs";

const { ArrayField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the saving throw activity.
 *
 * @property {string} ability - Ability required when rolling a saving throw.
 * @property {object} damage
 * @property {ExtendedDamageData[]} damage.parts - Parts of damage to include.
 * @property {object} dc
 * @property {string} dc.ability - Ability used to calculate the DC if not automatically calculated.
 * @property {string} dc.formula - DC formula if manually set.
 */
export class SavingThrowData extends foundry.abstract.DataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.SAVE", "BF.DAMAGE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new StringField({ initial: () => Object.keys(CONFIG.BlackFlag.abilities)[0] }),
			damage: new SchemaField({ parts: new ArrayField(new DamageField()) }),
			dc: new SchemaField({
				ability: new StringField(),
				formula: new FormulaField({ deterministic: true })
			})
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
