import ActivityConfig from "./activity-config.mjs";

/**
 * Application for configuring Damage activities.
 */
export default class DamageConfig extends ActivityConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/activities/damage-config.hbs"
		});
	}
}
