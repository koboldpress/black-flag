import BaseItemSheet from "./base-item-sheet.mjs";

export default class ClassSheet extends BaseItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "class", "item", "sheet"],
			template: "systems/black-flag/templates/item/class.hbs",
			width: 810,
			height: 900
		});
	}
}
