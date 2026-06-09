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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		const activity = this.item.system.activities.get(this.linked.id);
		if (activity && activity.activation?.override) this.parent.activation = activity.toObject().activation;

		super.prepareData();

		Object.defineProperty(this.parent.activation, "canOverride", {
			value: true,
			configurable: true,
			enumerable: false
		});
	}
}
