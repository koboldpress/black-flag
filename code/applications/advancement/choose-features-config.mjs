import { cleanedObjectUpdate } from "../../utils/object.mjs";
import GrantFeaturesConfig from "./grant-features-config.mjs";

/**
 * Configuration application for feature choices.
 */
export default class ChooseFeaturesConfig extends GrantFeaturesConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["choose-features", "two-column"],
		position: {
			width: 580
		}
	};

	/** @override */
	static PARTS = {
		config: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		details: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/choose-features-config-details.hbs"
		},
		items: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/choose-features-config-items.hbs",
			templates: ["systems/black-flag/templates/advancement/parts/features-list.hbs"]
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
		await super._preparePartContext(partId, context, options);
		if (partId === "details") return await this._prepareDetailsContext(context, options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the details.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareDetailsContext(context, options) {
		context.validTypes = this.advancement.constructor.VALID_TYPES.reduce((obj, type) => {
			obj[type] = game.i18n.localize(CONFIG.Item.typeLabels[type]);
			return obj;
		}, {});
		const makeLabels = obj =>
			Object.fromEntries(
				Object.entries(obj)
					.map(([k, d]) => [k, game.i18n.localize(`${d.localization}[one]`)])
					.sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]))
			);
		if (this.advancement.configuration.type === "feature") {
			const selectedCategory = CONFIG.BlackFlag.featureCategories[this.advancement.configuration.restriction.category];
			context.typeRestriction = {
				categoryLabel: game.i18n.localize("BF.Feature.Category.Label"),
				categoryOptions: makeLabels(CONFIG.BlackFlag.featureCategories),
				typeLabel: game.i18n.localize("BF.Feature.Type.Label"),
				typeOptions: selectedCategory?.children ? makeLabels(selectedCategory.children) : null
			};
		} else if (this.advancement.configuration.type === "talent") {
			context.typeRestriction = {
				categoryLabel: game.i18n.localize("BF.Feature.Talent.Category.Label"),
				categoryOptions: makeLabels(CONFIG.BlackFlag.talentCategories)
			};
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareConfigurationUpdate(configuration) {
		if (configuration.choices) configuration.choices = cleanedObjectUpdate(configuration.choices);

		// Ensure items are still valid if type restriction has changed
		const pool = [];
		for (const data of configuration.pool ? Object.values(configuration.pool) : this.advancement.configuration.pool) {
			if (
				this.advancement._validateItemType(await fromUuid(data.uuid), {
					type: configuration.type,
					restriction: configuration.restriction ?? {},
					strict: false
				})
			)
				pool.push(data);
		}
		configuration.pool = pool;

		return configuration;
	}
}
