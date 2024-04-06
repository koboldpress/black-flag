import ActivityConfig from "./activity-config.mjs";

/**
 * Application for configuring Healing activities.
 */
export default class HealingConfig extends ActivityConfig {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/activities/healing-config.hbs"
		});
	}
}
