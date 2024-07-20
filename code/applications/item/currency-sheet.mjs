import BaseItemSheet from "./base-item-sheet.mjs";

export default class CurrencySheet extends BaseItemSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "currency", "item", "sheet"],
			tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }],
			scrollY: ["[data-tab] > section"],
			template: "systems/black-flag/templates/item/currency.hbs",
			width: 600,
			height: 450
		});
	}
}
