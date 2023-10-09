import BaseDataModel from "./base-data-model.mjs";

export default class ItemDataModel extends BaseDataModel {

	/**
	 * @typedef {object} ItemRegistrationConfiguration
	 * @property {boolean} cached - Should a cached version of this item type be made ready?
	 */

	/**
	 * Metadata that describes an item data type.
	 *
	 * @typedef {BaseDataMetadata} ItemDataMetadata
	 * @property {string} [accentColor] - Accent color to use if none is specified by system data.
	 * @property {boolean|ItemRegistrationConfig} [register] - Register all items of this type within the central list.
	 */

	/**
	 * Metadata that describes a type.
	 * @type {ItemDataMetadata}
	 */
	static metadata = {};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should this Document run final data preparation on its own, or wait for another Document to call those methods?
	 * @type {boolean}
	 */
	get shouldPrepareFinalData() {
		return !this.parent?.isEmbedded;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply transformations or derivations to the values of the source data object.
	 */
	prepareDerivedData() {
		super.prepareDerivedData();
		if ( this.shouldPrepareFinalData ) this.prepareFinalData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Final data preparation steps performed on Items after parent actor has been fully prepared.
	 */
	prepareFinalData() {
		this.constructor._getMethods({ startingWith: "prepareFinal", notEndingWith: "Data" }).forEach(k => this[k]());
	}
}
