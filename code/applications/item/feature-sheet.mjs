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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		const makeLabels = obj => Object.fromEntries(Object.entries(obj)
			.map(([k, d]) => [k, game.i18n.localize(`${d.localization}[one]`)])
			.sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]))
		);
		context.featureCategories = makeLabels(CONFIG.BlackFlag.featureCategories);
		const featureCategory = CONFIG.BlackFlag.featureCategories[context.system.type.category];
		context.featureTypes = featureCategory?.types ? makeLabels(featureCategory.types) : null;

		return context;
	}
}
