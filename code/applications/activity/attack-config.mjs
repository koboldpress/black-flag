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
		const defaultType = this.item.system.type?.value;
		const defaultClassification = this.item.system.type?.classification;
		const context = foundry.utils.mergeObject(super.getData(options), {
			labels: {
				defaultType: defaultType ? game.i18n.format("BF.Default.Specific", {
					default: game.i18n.localize(CONFIG.BlackFlag.weaponTypes[defaultType])?.toLowerCase() ?? ""
				}) : null,
				defaultClassification: defaultClassification ? game.i18n.format("BF.Default.Specific", {
					default: game.i18n.localize(CONFIG.BlackFlag.attackTypes[defaultClassification])?.toLowerCase() ?? ""
				}) : null
			}
		});
		return context;
	}
}
