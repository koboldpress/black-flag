import ActivityConfig from "./activity-config.mjs";

/**
 * Application for configuring Attack activities.
 */
export default class AttackConfig extends ActivityConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/activities/attack-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = foundry.utils.mergeObject(super.getData(options), {
			labels: {
				// TODO: Generate these labels properly based on item (BF.Default.Specific)
				defaultType: "Default (melee)",
				defaultClassification: "Default (weapon)"
			}
		});
		return context;
	}
}
