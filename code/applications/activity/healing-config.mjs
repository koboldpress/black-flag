import ActivityConfig from "./activity-config.mjs";

/**
 * Application for configuring Healing activities.
 */
export default class HealingConfig extends ActivityConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/activities/healing-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		const defaultAbility = this.activity.system.defaultAbility;
		return foundry.utils.mergeObject(context, {
			labels: {
				defaultAbility: defaultAbility
					? game.i18n.format("BF.Default.Specific", {
							default: game.i18n.localize(defaultAbility).toLowerCase()
						})
					: game.i18n.localize("None")
			}
		});
	}
}
