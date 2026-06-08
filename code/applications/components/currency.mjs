import { staticID } from "../../utils/_module.mjs";
import InventoryElement from "./inventory.mjs";

export default class CurrencyElement extends InventoryElement {
	/**
	 * The HTML tag named used by this element.
	 * @type {string}
	 */
	static tagName = "blackflag-currency";

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Bring up the currency adding dialog.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 */
	async _onAddItem(target) {
		const content = await foundry.applications.handlebars.renderTemplate(
			"systems/black-flag/templates/shared/add-currency-dialog.hbs",
			{
				currencies: Object.entries(CONFIG.BlackFlag.currencies).reduce((obj, [k, config]) => {
					if (config.default) obj[k] = config;
					return obj;
				}, {})
			}
		);

		let formData;
		try {
			formData = await BlackFlag.applications.api.BFDialog.tooltipWait(
				{ element: target, cssClass: "add-currency" },
				{
					content,
					buttons: [
						{
							action: "addCurrency",
							label: "BF.Currency.Action.Add",
							icon: "fas fa-coins",
							default: true,
							callback: (event, button, dialog) => new FormData(dialog.element.querySelector("form"))
						}
					],
					window: {
						title: "BF.Currency.Action.Add"
					}
				}
			);
		} catch (err) {
			console.error(err);
			return;
		}
		if (!formData) return;

		let toCreate = [];
		for (let [key, delta] of formData.entries()) {
			delta = Number(delta);
			if (!delta || !Number.isFinite(delta)) continue;
			const existingItem = await this.findItem(i => i.type === "currency" && i.identifier === key);

			// Update the existing currency item in this inventory
			if (existingItem) {
				await existingItem.update({ "system.quantity": Math.max(0, existingItem.system.quantity + delta) });
			}

			// Fetch the base currency item and create it in this context
			else if (delta > 0) {
				const uuid = CONFIG.BlackFlag.currencies[key]?.uuid;
				const item = uuid ? await fromUuid(uuid) : null;
				if (!item) {
					console.error(`Could not find reference currency for "${key}" to create.`);
					continue;
				}
				const itemData = item.toObject();
				itemData._id = staticID(`bfcurrency${key}`);
				itemData.system.quantity = delta;
				if (this.document.type === "container") itemData.system.container = this.document.id;
				toCreate.push(itemData);
			}
		}

		if (toCreate.length) {
			await Item.createDocuments(toCreate, { keepId: true, pack: this.document.pack, parent: this.actor });
		}
	}
}
