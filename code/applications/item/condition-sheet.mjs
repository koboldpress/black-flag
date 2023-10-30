import BaseItemSheet from "./base-item-sheet.mjs";

export default class ConditionSheet extends BaseItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "condition", "item", "sheet"],
			dragDrop: [{ dropSelector: ".drop-target" }],
			template: "systems/black-flag/templates/item/condition.hbs",
			width: 600,
			height: 500
		});
	}
}
