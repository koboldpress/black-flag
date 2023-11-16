import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for hit points.
 */
export default class HitPointsConfig extends AdvancementConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "hit-points"],
			template: "systems/black-flag/templates/advancement/hit-points-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		context.hitDieSizes = Object.fromEntries(CONFIG.BlackFlag.hitDieSizes.map(n => [n, `d${n}`]));
		context.showClassRestriction = false;
		return context;
	}
}
