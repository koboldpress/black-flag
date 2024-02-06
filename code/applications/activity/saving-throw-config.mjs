import ActivityConfig from "./activity-config.mjs";

/**
 * Application for configuring Saving Throw activities.
 */
export default class SavingThrowConfig extends ActivityConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/activities/saving-throw-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		return context;
	}
}
