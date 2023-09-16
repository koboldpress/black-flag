import AdvancementItemSheet from "./advancement-item-sheet.mjs";

export default class ClassSheet extends AdvancementItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "class", "item", "sheet"],
			template: "systems/black-flag/templates/item/class.hbs",
			width: 810,
			height: 900
		});
	}
}
