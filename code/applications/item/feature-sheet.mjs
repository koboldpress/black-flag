import BaseItemSheet from "./base-item-sheet.mjs";

export default class FeatureSheet extends BaseItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "feature", "item", "sheet"],
			template: "systems/black-flag/templates/item/feature.hbs",
			width: 600,
			height: 500
		});
	}
}
