/**
 * Base advancement data model shared by advancement system data.
 */
export default class AdvancementDataModel extends foundry.abstract.DataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform the pre-localization of this data model.
	 */
	static localize() {
		(foundry.helpers?.Localization ?? Localization).localizeDataModel(this);
	}
}
