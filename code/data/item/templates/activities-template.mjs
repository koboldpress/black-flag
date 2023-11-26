import { ActivityField } from "../../fields/_module.mjs";

/**
 * Data definition template for items with activities.
 */
export default class ActivitiesTemplate extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			activities: new ActivityField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get any actions provided by activities on this item.
	 * @yields {object}
	 */
	*actions() {
		for ( const activity of this.activities ) {
			yield activity;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create one or more activity documents when this item is created.
	 * @param {object[]} data - Initial data for activity documents. Must include "type".
	 * @internal
	 */
	_createInitialActivities(data) {
		const activities = {};
		for ( const initialData of data ) {
			const ActivityClass = CONFIG.Activity.types[initialData.type].documentClass;
			if ( !initialData._id ) initialData._id = foundry.utils.randomID();
			activities[initialData._id] = new ActivityClass(initialData, { parent: this.parent }).toObject();
		}
		this.parent.updateSource({"system.activities": activities});
	}
}
