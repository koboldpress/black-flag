import ChooseFeaturesConfig from "./choose-features-config.mjs";

/**
 * Configuration application for spell choices.
 */
export default class ChooseSpellsConfig extends ChooseFeaturesConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "choose-spells", "two-column"],
			template: "systems/black-flag/templates/advancement/choose-spells-config.hbs",
			width: 620
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options = {}) {
		const context = super.getData(options);
		context.alwaysPreparable =
			CONFIG.BlackFlag.spellPreparationModes[context.configuration.spell.mode]?.preparable ?? false;
		context.spellCircles = CONFIG.BlackFlag.spellCircles();
		return context;
	}
}
