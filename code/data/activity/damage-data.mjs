import ActivityDataModel from "../abstract/activity-data-model.mjs";
import DamageField from "../fields/damage-field.mjs";
import FormulaField from "../fields/formula-field.mjs";
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
		// Added in 0.10.042
		if ("damage" in source) {
			if ("allowCritical" in source.damage) {
				foundry.utils.setProperty(source, "damage.critical.allow", source.damage.allowCritical);
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		this.applyShims();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Shims                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add shims for removed properties.
	 */
	applyShims() {
		Object.defineProperty(this.damage, "allowCritical", {
			get() {
				foundry.utils.logCompatibilityWarning(
					"The `damage.allowCritical` property on `DamageData` has been moved to `damage.critical.allow`",
					{ since: "Black Flag 0.10.042", until: "Black Flag 0.10.047" }
				);
				return this.damage.critical.allow;
			},
			configurable: true
		});
	}
}
