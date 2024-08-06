import GrantFeaturesConfig from "./grant-features-config.mjs";

/**
 * Configuration application for spell grants.
 */
export default class GrantSpellsConfig extends GrantFeaturesConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grant-spells"]
	};

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		spellConfig: {
			template: "systems/black-flag/templates/advancement/parts/advancement-spell-configuration.hbs"
		},
		items: {
			template: "systems/black-flag/templates/advancement/grant-spells-config-items.hbs",
			templates: ["systems/black-flag/templates/advancement/parts/spells-list.hbs"]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		await super._preparePartContext(partId, context, options);
		if (partId === "spellConfig") return await GrantSpellsConfig._prepareSpellConfigContext(context, options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the spell configuration section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	static async _prepareSpellConfigContext(context, options) {
		context.abilities = Object.entries(CONFIG.BlackFlag.abilities.localized).reduce((obj, [key, label]) => {
			obj[key] = { label, selected: context.configuration.spell.ability.has(key) ? "selected" : "" };
			return obj;
		}, {});
		context.alwaysPreparable =
			CONFIG.BlackFlag.spellPreparationModes[context.configuration.spell.mode]?.preparable ?? false;
		return context;
	}
}
