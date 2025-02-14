import GrantFeaturesConfig from "./grant-features-config.mjs";

/**
 * Configuration application for spell grants.
 */
export default class GrantSpellsConfig extends GrantFeaturesConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grant-spells", "form-list"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

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
		const data = context.configuration.data.spell;
		context.spell = {
			abilityOptions: CONFIG.BlackFlag.abilities.localizedOptions,
			alwaysPreparable: CONFIG.BlackFlag.spellPreparationModes[data.mode]?.preparable ?? false,
			data,
			fields: context.configuration.fields.spell.fields,
			originOptions: [
				{ value: "", label: "" },
				...CONFIG.BlackFlag.registration.groupedOptions(["class", "subclass"]).formOptions()
			],
			showRequireSpellSlot: CONFIG.BlackFlag.spellPreparationModes[data.mode]?.scalable ?? false
		};
		return context;
	}
}
