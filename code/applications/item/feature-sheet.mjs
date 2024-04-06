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

		if (this.document.type === "feature") {
			context.featureCategories = CONFIG.BlackFlag.featureCategories.localized;
			const featureCategory = CONFIG.BlackFlag.featureCategories[context.system.type.category];
			if (
				(featureCategory && ["class", "lineage", "heritage"].includes(context.system.type.category)) ||
				featureCategory?.children
			)
				context.featureTypes = {
					label: game.i18n.format("BF.Feature.Type.LabelSpecific", {
						type: game.i18n.localize(`${featureCategory.localization}[one]`)
					}),
					options: featureCategory?.children?.localized ?? null,
					selected: context.system.type.value || context.system.identifier.associated
				};
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
		const type = foundry.utils.getProperty(update, "system.type.value");
		if (type && this.document.type === "feature") {
			const category = foundry.utils.getProperty(update, "system.type.category") ?? this.document.system.type.category;
			const featureTypes = CONFIG.BlackFlag.featureCategories[category]?.children ?? {};
			if (!(type in featureTypes)) {
				foundry.utils.setProperty(update, "system.identifier.associated", type);
				foundry.utils.setProperty(update, "system.type.value", "");
			} else {
				foundry.utils.setProperty(update, "system.identifier.associated", "");
			}
		}

		super._updateObject(event, foundry.utils.flattenObject(update));
	}
}
