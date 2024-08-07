import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for hit points.
 */
export default class HitPointsConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["hit-points"]
	};

	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		hitDice: {
			template: "systems/black-flag/templates/advancement/hit-points-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.hitDieSizes = Object.fromEntries(CONFIG.BlackFlag.hitDieSizes.map(n => [n, `d${n}`]));
		context.showClassRestriction = false;
		return context;
	}
}
