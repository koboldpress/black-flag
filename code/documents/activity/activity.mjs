import BaseActivity from "../../data/activity/base-activity.mjs";
import PseudoDocumentMixin from "../pseudo-document.mjs";

/**
 * Abstract base class which various activity types can subclass.
 * @param {object} [data={}] - Raw data stored in the activity object.
 * @param {object} [options={}] - Options which affect DataModel construction.
 * @abstract
 */
export default class Activity extends PseudoDocumentMixin(BaseActivity) {

	/**
	 * Information on how an advancement type is configured.
	 *
	 * @typedef {PseudoDocumentsMetadata} ActivityMetadata
	 * @property {string} name - Type name of the advancement.
	 * @property {typeof DataModel} [dataModel] - Data model for custom system data.
	 * @property {string} icon - Icon used if no user icon is specified.
	 * @property {string} title - Title to be displayed if no user title is specified.
	 * @property {string} hint - Description of this type shown in the activity selection dialog.
	 */

	/**
	 * Configuration information for this activity type.
	 * @type {ActivityMetadata}
	 */
	static get metadata() {
		return {
			pseudoDocumentType: "Activity",
			pseudoDocumentCollection: "activities",
			icon: "",
			title: "",
			hint: ""
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data for the Advancement.
	 */
	prepareData() {
		this.title = this.title || this.constructor.metadata.title;
		this.icon = this.icon || this.constructor.metadata.icon;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */
}
