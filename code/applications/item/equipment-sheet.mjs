import { filteredKeys, makeLabel, sortObjectEntries } from "../../utils/_module.mjs";
import EffectsElement from "../components/effects.mjs";
import BaseItemSheet from "./base-item-sheet.mjs";

export default class EquipmentSheet extends BaseItemSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "equipment", "item", "sheet"],
			tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }],
			scrollY: ["[data-tab] > section"],
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get template() {
		return `systems/black-flag/templates/item/${this.document.type}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.effects = EffectsElement.prepareItemContext(this.item.effects);

		// Category
		if (context.system.validCategories?.localized)
			context.categories = {
				options: context.system.validCategories.localized,
				blank: ""
			};

		// Type
		if (this.item.type === "weapon") {
			context.types = { options: CONFIG.BlackFlag.weaponTypes.localized };
		}

		// Base
		const category = context.system.validCategories?.[context.source.type.category];
		if (category?.children)
			context.baseItems = {
				options: sortObjectEntries(
					Object.entries(category.children).reduce((obj, [key, config]) => {
						if (
							!foundry.utils.hasProperty(this.item, "system.type.value") ||
							!config.type ||
							config.type === context.source.type.value
						)
							obj[key] = makeLabel(config);
						return obj;
					}, {})
				),
				blank: ""
			};

		const has = (data, key) => data.includes?.(key) ?? data.has?.(key);

		context.options = Object.entries(context.system.validOptions ?? {}).reduce((obj, [k, o]) => {
			obj[k] = { label: game.i18n.localize(o.label), selected: has(context.source.options, k) };
			return obj;
		}, {});

		context.attunementOptions = [
			{ value: "", label: game.i18n.localize("BF.Attunement.Type.None") },
			{ value: "optional", label: game.i18n.localize("BF.Attunement.Type.Optional") },
			{ value: "required", label: game.i18n.localize("BF.Attunement.Type.Required") }
		];
		context.proficiencyOptions = [
			{ value: null, label: game.i18n.localize("BF.Proficiency.Override.Auto") },
			{ value: true, label: game.i18n.localize("BF.Proficiency.Override.Always") },
			{ value: false, label: game.i18n.localize("BF.Proficiency.Override.Never") }
		];

		context.properties = Object.entries(context.system.validProperties ?? {}).reduce((obj, [k, label]) => {
			obj[k] = { label, selected: has(context.source.properties, k) };
			return obj;
		}, {});

		// Hack for armor to get around handlebars' weird behavior when calling methods
		context.modifierHint = context.system.modifierHint?.();

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getSubmitData(updateData = {}) {
		const data = foundry.utils.expandObject(super._getSubmitData(updateData));

		if (foundry.utils.hasProperty(data, "system.options")) {
			data.system.options = filteredKeys(data.system.options);
		}

		if (foundry.utils.hasProperty(data, "system.properties")) {
			data.system.properties = filteredKeys(data.system.properties);
		}

		if (foundry.utils.hasProperty(data, "system.overrides.proficiency")) {
			if (data.system.overrides.proficiency === "null") data.system.overrides.proficiency = null;
		}

		return foundry.utils.flattenObject(data);
	}
}
