import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for improvement.
 */
export default class ImprovementConfig extends AdvancementConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "improvement"],
			template: "systems/black-flag/templates/advancement/improvement-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options) {
		const context = super.getData(options);
		context.showClassRestriction = false;
		if (this.advancement.metadata.type === "expandedTalentList") context.showLevelSelector = false;
		context.talentCategories = Object.entries(CONFIG.BlackFlag.talentCategories.localizedPlural).reduce(
			(obj, [key, label]) => {
				obj[key] = { label, selected: this.advancement.configuration.talentList.has(key) ? "selected" : "" };
				return obj;
			},
			{}
		);
		return context;
	}
}
