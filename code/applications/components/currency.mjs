import InventoryElement from "./inventory.mjs";

export default class CurrencyElement extends InventoryElement {
	/**
	 * Bring up the currency adding dialog.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 */
	async _onAddItem(target) {
		console.log("Add currency");
	}
}
