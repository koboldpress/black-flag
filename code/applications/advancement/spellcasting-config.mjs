import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for spellcasting.
 */
export default class SpellcastingConfig extends AdvancementConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "spellcasting"],
			template: "systems/black-flag/templates/advancement/spellcasting-config.hbs",
			width: 450
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);

		context.displayType = Object.keys(CONFIG.BlackFlag.spellcastingTypes).length > 1;
		context.progressionOptions = CONFIG.BlackFlag.spellcastingTypes[context.configuration.type]?.progression;

		return context;
	}
}
