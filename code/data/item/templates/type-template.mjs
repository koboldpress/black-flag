/**
 * Data definition template for Items with type category.
 */
export default class TypeTemplate extends foundry.abstract.DataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item categories used to populate `system.type.category`.
	 * @type {Record<string, string>}
	 */
	static get validCategories() {
		return {};
	}

	get validCategories() {
		return this.constructor.validCategories;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item types used to populate `system.type.value`.
	 * @type {Record<string, string>|null}
	 */
	static get validTypes() {
		return null;
	}

	get validTypes() {
		return this.constructor.validTypes;
	}
}
