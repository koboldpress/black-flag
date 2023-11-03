import { filteredKeys } from "../../utils/_module.mjs";
import BaseItemSheet from "./base-item-sheet.mjs";

export default class SpellSheet extends BaseItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "spell", "item", "sheet"],
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}],
			scrollY: ["[data-tab] > section"],
			template: "systems/black-flag/templates/item/spell.hbs",
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.components = Object.entries(CONFIG.BlackFlag.spellComponents).reduce((obj, [k, p]) => {
			obj[k] = { label: game.i18n.localize(p.label), selected: context.system.components.required.has(k) };
			return obj;
		}, {});

		context.tags = Object.entries(CONFIG.BlackFlag.spellTags).reduce((obj, [k, p]) => {
			obj[k] = { label: game.i18n.localize(p.label), selected: context.system.tags.has(k) };
			return obj;
		}, {});

		context.activationOptions = CONFIG.BlackFlag.activationOptions({ chosen: context.system.casting.type });
		context.durationOptions = CONFIG.BlackFlag.durationOptions({ chosen: context.system.duration.units });
		context.spellRings = CONFIG.BlackFlag.spellRings();

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	_getSubmitData(updateData={}) {
		const data = foundry.utils.expandObject(super._getSubmitData(updateData));

		if ( foundry.utils.hasProperty(data, "system.components.required") ) {
			data.system.components.required = filteredKeys(data.system.components.required);
		}

		return foundry.utils.flattenObject(data);
	}
}
