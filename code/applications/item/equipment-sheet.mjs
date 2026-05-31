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
		context.hidePrice = this.item.system.identified === false;

		// Category
		if (context.system.validCategories?.localizedOptions) {
			context.category = {};
			context.category.options = [{ value: "", label: "" }, ...context.system.validCategories.localizedOptions];
		}

		// Base
		const category = context.system.validCategories?.[context.source.type.category];
		if (category?.children) {
			context.baseItem = {};
			context.baseItem.options = [
				{ value: "", label: "" },
				...Object.entries(category.children)
					.map(([key, config]) => {
						if (
							!foundry.utils.hasProperty(this.item, "system.type.value") ||
							!config.type ||
							config.type === context.source.type.value
						)
							return { value: key, label: makeLabel(config) };
						return null;
					})
					.filter(_ => _)
					.sort((lhs, rhs) => lhs.label.localeCompare(rhs.label, game.i18n.lang))
			];
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareDetailsContext(context, options) {
		context = await super._prepareDetailsContext(context, options);

		const has = (data, key) => data.includes?.(key) ?? data.has?.(key);
		context.attunementOptions = [
			{ value: "", label: _loc("BF.Attunement.Type.None") },
			{ value: "optional", label: _loc("BF.Attunement.Type.Optional") },
			{ value: "required", label: _loc("BF.Attunement.Type.Required") }
		];
		context.proficiencyOptions = [
			{ value: null, label: _loc("BF.Proficiency.Override.Auto") },
			{ value: true, label: _loc("BF.Proficiency.Override.Always") },
			{ value: false, label: _loc("BF.Proficiency.Override.Never") }
		];
		context.properties = (context.system.validProperties?.entries() ?? []).reduce((obj, [k, label]) => {
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
