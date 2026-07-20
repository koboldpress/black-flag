import { defaultUnit, prepareFormulaValue } from "../../utils/_module.mjs";
import ActivityDataModel from "../abstract/activity-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";

const { BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Forward activity.
 * @property {object} distance
 * @property {boolean} distance.override - Replace activity's range when determining max teleport distance.
 * @property {string} distance.value - Maximum distance allowed to teleport.
 * @property {string} distance.unit - Unit used to measure the maximum distance.
 */
export class TeleportData extends ActivityDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.TELEPORT"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			distance: new SchemaField({
				override: new BooleanField(),
				value: new FormulaField({ deterministic: true }),
				unit: new StringField({ required: true, blank: false, initial: () => defaultUnit("distance") })
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		if (!source) return super.migrateData(source);

		// Added in 3.0.078
		if ("unlimited" in source && "distance" in source) {
			if (source.unlimited) {
				source.distance.override = true;
				source.distance.value = "";
			} else if (source.distance.value && !("override" in source.distance)) {
				source.distance.override = true;
			}
			delete source.unlimited;
		}

		return super.migrateData(source);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData(rollData) {
		rollData ??= this.parent.getRollData({ deterministic: true });
		super.prepareFinalData(rollData);

		if (!this.distance.override) {
			if (this.parent.range.unit === "any") this.distance.value = Infinity;
			else if (this.parent.range.scalar) {
				this.distance.unit = this.parent.range.unit;
				this.distance.value = this.parent.range.value;
			} else this.distance.value = 0;
		} else if (this.distance.value) {
			prepareFormulaValue(this, "distance.value", "DND5E.TELEPORT.FIELDS.teleport.value.label", rollData);
		}

		if (this.distance.value === "") this.distance.value = Infinity;
	}
}
