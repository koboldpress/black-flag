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
		const context = super.getData(options);
		const defaultType = CONFIG.BlackFlag.weaponTypes[this.item.system.type?.value]?.label;
		const defaultClassification = CONFIG.BlackFlag.attackTypes[this.item.system.type?.classification];
		foundry.utils.mergeObject(context, {
			labels: {
				defaultType: defaultType ? game.i18n.format("BF.Default.Specific", {
					default: game.i18n.localize(defaultType).toLowerCase()
				}) : null,
				defaultClassification: defaultClassification ? game.i18n.format("BF.Default.Specific", {
					default: game.i18n.localize(defaultClassification).toLowerCase()
				}) : null
			}
		});
		return context;
	}
}
