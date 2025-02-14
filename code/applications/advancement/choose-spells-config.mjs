import ChooseFeaturesConfig from "./choose-features-config.mjs";
import GrantSpellsConfig from "./grant-spells-config.mjs";

/**
 * Configuration application for spell choices.
 */
export default class ChooseSpellsConfig extends ChooseFeaturesConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["choose-spells", "grid-columns"],
		position: {
			width: 920
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			container: { classes: ["column-container"], id: "column-left" },
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		spellConfig: {
			container: { classes: ["column-container"], id: "column-left" },
			template: "systems/black-flag/templates/advancement/parts/advancement-spell-configuration.hbs"
		},
		restrictions: {
			container: { classes: ["column-container"], id: "column-center" },
			template: "systems/black-flag/templates/advancement/choose-spells-config-restrictions.hbs"
		},
		items: {
			container: { classes: ["column-container"], id: "column-center" },
			template: "systems/black-flag/templates/advancement/choose-spells-config-items.hbs",
			templates: ["systems/black-flag/templates/advancement/parts/spells-list.hbs"]
		},
		levels: {
			container: { classes: ["column-container"], id: "column-right" },
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
		context.ritualModeOptions = [
			{ value: "", label: "BF.Advancement.ChooseSpells.FIELDS.restriction.allowRituals.None" },
			{ value: "allow", label: "BF.Advancement.ChooseSpells.FIELDS.restriction.allowRituals.Allow" },
			{ value: "only", label: "BF.Advancement.ChooseSpells.FIELDS.restriction.allowRituals.Only" }
		];
		context.spellCircleOptions = [
			{ value: -1, label: game.i18n.localize("BF.Advancement.ChooseSpells.FIELDS.restriction.circle.Available") },
			{ rule: true },
			...CONFIG.BlackFlag.spellCircles({ formOptions: true })
		];
		return context;
	}
}
