import ActivityDataModel from "../abstract/activity-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import DamageField from "../fields/shared/damage-field.mjs";
import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField, BooleanField, SchemaField } = foundry.data.fields;

/**
 * Configuration data for the damage activity.
 *
 * @property {object} damage
 * @property {object} damage.critical
 * @property {boolean} damage.critical.allow - Can critical damage be rolled?
 * @property {string} damage.critical.bonus - Extra damage applied to the first damage part when a critical is rolled.
 * @property {ExtendedDamageData[]} damage.parts - Parts of damage to include.
 * @property {EffectApplicationData[]} effects - Effects to be applied.
 */
export class DamageData extends ActivityDataModel {
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
				critical: new SchemaField({
					allow: new BooleanField(),
					bonus: new FormulaField()
				}),
				parts: new ArrayField(new DamageField())
			}),
			effects: new ArrayField(new AppliedEffectField())
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		if (!source) return super.migrateData(source);

		// Added in 0.10.042
		if ("damage" in source) {
			if ("allowCritical" in source.damage) {
				foundry.utils.setProperty(source, "damage.critical.allow", source.damage.allowCritical);
			}
		}

		return super.migrateData(source);
	}
}
