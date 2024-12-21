import ChooseFeaturesConfig from "./choose-features-config.mjs";
import GrantSpellsConfig from "./grant-spells-config.mjs";

/**
 * Configuration application for spell choices.
 */
export default class ChooseSpellsConfig extends ChooseFeaturesConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["choose-spells"],
		columns: 3,
		position: {
			width: 920
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		spellConfig: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/parts/advancement-spell-configuration.hbs"
		},
		restrictions: {
			classes: ["center-column"],
			template: "systems/black-flag/templates/advancement/choose-spells-config-restrictions.hbs"
		},
		items: {
			classes: ["center-column"],
			template: "systems/black-flag/templates/advancement/choose-spells-config-items.hbs",
			templates: ["systems/black-flag/templates/advancement/parts/spells-list.hbs"]
		},
		levels: {
			classes: ["right-column"],
			template: "systems/black-flag/templates/advancement/parts/choice-levels.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = { ...(await super._preparePartContext(partId, context, options)) };
		if (partId === "spellConfig") return await GrantSpellsConfig._prepareSpellConfigContext(context, options);
		if (partId === "restrictions") return await this._prepareRestrictionsContext(context, options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the restrictions section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareRestrictionsContext(context, options) {
		context.ritualModes = {
			allow: "BF.Advancement.ChooseSpells.FIELDS.restriction.allowRituals.Allow",
			only: "BF.Advancement.ChooseSpells.FIELDS.restriction.allowRituals.Only"
		};
		context.spellCircles = CONFIG.BlackFlag.spellCircles();
		return context;
	}
}
