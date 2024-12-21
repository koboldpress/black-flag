import ActivityDataModel from "../abstract/activity-data-model.mjs";

const { DocumentIdField, SchemaField } = foundry.data.fields;

/**
 * Configuration data for the Forward activity.
 * @property {object} linked
 * @property {string} linked.id  ID of the activity to forward to.
 */
export class ForwardData extends ActivityDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.FORWARD"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			linked: new SchemaField({
				id: new DocumentIdField()
			})
		};
	}
}
