import { defaultUnit, prepareFormulaValue } from "../../utils/_module.mjs";
import ActivityDataModel from "../abstract/activity-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";

const { BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Forward activity.
 * @property {object} distance
 * @property {string} distance.value - Maximum distance allowed to teleport.
 * @property {string} distance.unit - Unit used to measure the maximum distance.
 * @property {boolean} unlimited - Allow teleporting beyond maximum distance.
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
				value: new FormulaField({ deterministic: true }),
				unit: new StringField({ required: true, blank: false, initial: () => defaultUnit("distance") })
			}),
			unlimited: new BooleanField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData(rollData) {
		rollData ??= this.parent.getRollData({ deterministic: true });
		super.prepareFinalData(rollData);
		prepareFormulaValue(this, "distance.value", "DND5E.TELEPORT.FIELDS.teleport.value.label", rollData);
	}
}
