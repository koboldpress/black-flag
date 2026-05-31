import { filteredKeys, formatNumber } from "../../../utils/_module.mjs";
import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Configuration application for AC formulas, bonuses, and other values.
 */
export default class ArmorClassConfig extends BaseConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["armor-class"],
		position: {
			width: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/actor/config/armor-class-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return _loc("BF.Action.Configure.Specific", { type: _loc("BF.ARMORCLASS.Label") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);

		context.ac = {
			data: context.system.data.attributes.ac,
			fields: context.system.fields.attributes.fields.ac.fields,
			source: context.system.source.attributes.ac
		};

		context.armorFormulas = context.system.data.attributes.ac.formulas.map(data => ({
			...data,
			checked: data.enabled !== false,
			disabled: {
				checkbox: data.type !== "base",
				input: true
			},
			keyPath: "baseFormulas"
		}));

		context.equipped = {};
		for (const key of ["armor", "shield"]) {
			const item = context.system.data.attributes.ac[`equipped${key.capitalize()}`];
			if (item)
				context.equipped[key] = {
					anchor: item.toAnchor().outerHTML,
					img: item.img,
					magicalBonus: formatNumber(item.system.properties.has("magical") ? item.system.magicalBonus : 0, {
						signDisplay: "always"
					}),
					name: item.name,
					value: formatNumber(item.system.armor.value, { signDisplay: key === "shield" ? "always" : "auto" })
				};
		}
		if (foundry.utils.isEmpty(context.equipped)) delete context.equipped;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareModifiers() {
		return [
			{
				category: "armor-class",
				type: "bonus",
				label: "BF.ARMORCLASS.Label",
				modifiers: this.getModifiers([{ k: "type", v: "armor-class" }], [], f => f.type === "bonus")
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: "armor-class" }] };
		return data;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);

		if (submitData.baseFormulas) {
			foundry.utils.setProperty(submitData, "system.attributes.ac.baseFormulas", filteredKeys(submitData.baseFormulas));
			delete submitData.baseFormulas;
		}

		return submitData;
	}
}
