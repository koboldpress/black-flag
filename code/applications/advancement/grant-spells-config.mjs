import GrantFeaturesConfig from "./grant-features-config.mjs";

/**
 * Configuration application for spell grants.
 */
export default class GrantSpellsConfig extends GrantFeaturesConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "grant-spells"],
			template: "systems/black-flag/templates/advancement/grant-spells-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
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
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareConfigurationUpdate(configuration) {
		configuration.spell.ability ??= [];
		return configuration;
	}
}
