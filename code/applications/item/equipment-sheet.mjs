import { filteredKeys, makeLabel, sortObjectEntries } from "../../utils/_module.mjs";
import BaseItemSheet from "./api/base-item-sheet.mjs";

/**
 * Item sheet responsible for displaying physical items.
 */
export default class EquipmentSheet extends BaseItemSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["equipment"],
		position: {
			width: 620,
			height: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareDescriptionContext(context, options) {
		context = await super._prepareDescriptionContext(context, options);
		context.descriptionParts = ["blackFlag.description-equipment"];
		context.showSidebar = true;

		// Category
		if (context.system.validCategories?.localized)
			context.categories = {
				options: context.system.validCategories.localized,
				blank: ""
			};

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

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareDetailsContext(context, options) {
		context = await super._prepareDetailsContext(context, options);

		const has = (data, key) => data.includes?.(key) ?? data.has?.(key);
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

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);

		if (foundry.utils.hasProperty(submitData, "system.options")) {
			submitData.system.options = filteredKeys(submitData.system.options);
		}

		if (foundry.utils.hasProperty(submitData, "system.properties")) {
			submitData.system.properties = filteredKeys(submitData.system.properties);
		}

		if (foundry.utils.hasProperty(submitData, "system.overrides.proficiency")) {
			if (submitData.system.overrides.proficiency === "null") submitData.system.overrides.proficiency = null;
		}

		return submitData;
	}
}
