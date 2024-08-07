import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for improvement.
 */
export default class ImprovementConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["improvement"]
	};

	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		improvement: {
			template: "systems/black-flag/templates/advancement/improvement-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
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
