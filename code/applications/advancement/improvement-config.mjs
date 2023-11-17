import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for improvement.
 */
export default class ImprovementConfig extends AdvancementConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "improvement"],
			template: "systems/black-flag/templates/advancement/improvement-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		context.showClassRestriction = false;
		if ( this.advancement.metadata.name === "expandedTalentList" ) context.showLevelSelector = false;
		return context;
	}
}
