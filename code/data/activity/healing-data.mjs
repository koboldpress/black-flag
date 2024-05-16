import { DamageField } from "../fields/_module.mjs";

const { StringField } = foundry.data.fields;

/**
 * Configuration data for the Healing activity.
 * @property {string} ability - Ability used in evaluating healing formula.
 * @property {object} healing - Healing value.
 */
export class HealingData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new StringField(),
			healing: new DamageField({}, { initial: { type: "normal" }, label: "BF.Healing.Label" })
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
}
