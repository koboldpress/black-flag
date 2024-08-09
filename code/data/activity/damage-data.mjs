import DamageField from "../fields/damage-field.mjs";

const { ArrayField, BooleanField, SchemaField } = foundry.data.fields;

/**
 * Configuration data for the damage activity.
 *
 * @property {object} damage
 * @property {boolean} damage.allowCritical - Can critical damage be rolled?
 * @property {ExtendedDamageData[]} damage.parts - Parts of damage to include.
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
			})
		};
	}
}
