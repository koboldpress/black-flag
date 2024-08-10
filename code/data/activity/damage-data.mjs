import DamageField from "../fields/damage-field.mjs";
import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField, BooleanField, SchemaField } = foundry.data.fields;

/**
 * Configuration data for the damage activity.
 *
 * @property {object} damage
 * @property {boolean} damage.allowCritical - Can critical damage be rolled?
 * @property {ExtendedDamageData[]} damage.parts - Parts of damage to include.
 * @property {EffectApplicationData[]} effects - Effects to be applied.
 */
export class DamageData extends foundry.abstract.DataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.DAMAGE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			damage: new SchemaField({
				allowCritical: new BooleanField(),
				parts: new ArrayField(new DamageField())
			}),
			effects: new ArrayField(new AppliedEffectField())
		};
	}
}
