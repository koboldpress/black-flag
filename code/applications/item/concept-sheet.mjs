import AdvancementItemSheet from "./advancement-item-sheet.mjs";

export default class ConceptSheet extends AdvancementItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "concept", "item", "sheet"],
			template: "systems/black-flag/templates/item/concept.hbs",
			width: 810,
			height: 900
		});
	}
}
