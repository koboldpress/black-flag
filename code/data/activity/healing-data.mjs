// import { buildRoll, simplifyBonus } from "../../utils/_module.mjs";
import { DamageField } from "../fields/_module.mjs";

const { StringField } = foundry.data.fields;

/**
 * Configuration data for the Healing activity.
 * @property {string} ability - Ability used in evaluating healing formula.
 * @property {object} healing - Healing value.
 */
export class HealingData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			ability: new StringField(),
			healing: new DamageField({}, { initial: { type: "normal" }, label: "BF.Healing.Label" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareFinalData() {
		// const ability = this.parent.actor?.system.abilities[this.parent.attackAbility];
		// const rollData = this.parent.item.getRollData({ deterministic: true });
		// const { parts, data } = buildRoll({
		// 	mod: ability?.mod,
		// 	prof: this.parent.item.system.proficiency?.flat,
		// 	bonus: this.parent.actor?.system.buildBonus(this.parent.actor?.system.getModifiers(this.parent.modifierData), {
		// 		rollData
		// 	})
		// }, rollData);
		// Object.defineProperty(this, "toHit", {
		// 	value: simplifyBonus(parts.join(" + "), data),
		// 	configurable: true,
		// 	enumerable: false
		// });
	}
}
