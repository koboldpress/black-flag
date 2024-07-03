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
		context.abilities = Object.entries(CONFIG.BlackFlag.abilities.localized).reduce((obj, [key, label]) => {
			obj[key] = { label, selected: context.configuration.spell.ability.has(key) ? "selected" : "" };
			return obj;
		}, {});
		context.alwaysPreparable =
			CONFIG.BlackFlag.spellPreparationModes[context.configuration.spell.mode]?.preparable ?? false;
		context.ritualModes = {
			allow: "BF.Advancement.ChooseSpells.FIELDS.restriction.allowRituals.Allow",
			only: "BF.Advancement.ChooseSpells.FIELDS.restriction.allowRituals.Only"
		};
		context.spellCircles = CONFIG.BlackFlag.spellCircles();
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareConfigurationUpdate(configuration) {
		configuration.spell.ability ??= [];
		configuration = super.prepareConfigurationUpdate(configuration);
		return configuration;
	}
}
