import BlackFlagActiveEffect from "../../documents/active-effect.mjs";
import AdvancementElement from "../components/advancement.mjs";
import EffectsElement from "../components/effects.mjs";
import BaseItemSheet from "./base-item-sheet.mjs";
import PrerequisiteConfig from "./config/prerequisite-config.mjs";

export default class FeatureSheet extends BaseItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "feature", "item", "sheet"],
			tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }],
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get template() {
		return `systems/black-flag/templates/item/${this.document.type}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.advancement = AdvancementElement.prepareContext(this.item.system.advancement);
		context.effects = EffectsElement.prepareContext(this.item.effects);
		context.type = {};

		if (this.document.type === "feature") {
			context.type.categories = CONFIG.BlackFlag.featureCategories.localized;

			const featureCategory = CONFIG.BlackFlag.featureCategories[context.system.type.category];
			const id = new Set([context.system.identifier.associated]);
			if (featureCategory?.sources)
				context.type.categorySources = CONFIG.BlackFlag.registration.groupedOptions(featureCategory.sources, id);
			const featureType = featureCategory?.children?.[context.system.type.value];
			if (featureType?.sources)
				context.type.typeSources = CONFIG.BlackFlag.registration.groupedOptions(featureType.sources, id);

			if (
				(featureCategory && ["class", "lineage", "heritage"].includes(context.system.type.category)) ||
				featureCategory?.children
			) {
				context.type.types = {
					label: game.i18n.format("BF.Feature.Type.LabelSpecific", {
						type: game.i18n.localize(`${featureCategory.localization}[one]`)
					}),
					options: featureCategory?.children?.localized ?? null,
					selected: context.system.type.value || context.system.identifier.associated
				};
			}

			if (context.system.type.category === "class") {
				context.type.displayLevel = true;
				context.type.fixedLevel = featureType?.level;
			}
		} else if (this.document.type === "talent") {
			context.talentCategories = CONFIG.BlackFlag.talentCategories.localized;
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll('[data-action="effect"]')) {
			element.addEventListener("click", BlackFlagActiveEffect.onEffectAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_onAction(event) {
		const { action, ...properties } = event.currentTarget.dataset;
		switch (action) {
			case "config":
				switch (properties.type) {
					case "prerequisite":
						return new PrerequisiteConfig(this.document).render(true);
				}
		}
		return super._onAction(event);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_updateObject(event, formData) {
		const update = foundry.utils.expandObject(formData);

		// Figure out where to save the value of Feature Type
		if (this.document.type === "feature") {
			const category = foundry.utils.getProperty(update, "system.type.category");
			const type = foundry.utils.getProperty(update, "system.type.value");
			let identifier = foundry.utils.getProperty(update, "system.identifier.associated");
			const categoryConfig = CONFIG.BlackFlag.featureCategories[category];
			const typeConfig = categoryConfig?.children?.[type];

			// If no type config, set type to blank
			if (!typeConfig) {
				identifier ??= type;
				foundry.utils.setProperty(update, "system.type.value", "");
			}

			const validSources = CONFIG.BlackFlag.registration.groupedOptions(
				new Set([...(categoryConfig?.sources ?? []), ...(typeConfig?.sources ?? [])])
			);
			foundry.utils.setProperty(
				update,
				"system.identifier.associated",
				validSources.set.has(identifier) ? identifier : ""
			);
		}

		super._updateObject(event, foundry.utils.flattenObject(update));
	}
}
