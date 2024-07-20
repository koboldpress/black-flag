import { filteredKeys } from "../../utils/_module.mjs";
import EffectsElement from "../components/effects.mjs";
import BaseItemSheet from "./base-item-sheet.mjs";

export default class SpellSheet extends BaseItemSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "spell", "item", "sheet"],
			tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }],
			scrollY: ["[data-tab] > section"],
			template: "systems/black-flag/templates/item/spell.hbs",
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.effects = EffectsElement.prepareItemContext(this.item.effects);

		context.components = Object.entries(CONFIG.BlackFlag.spellComponents).reduce((obj, [k, p]) => {
			obj[k] = { label: game.i18n.localize(p.label), selected: context.system.components.required.has(k) };
			return obj;
		}, {});

		context.tags = Object.entries(CONFIG.BlackFlag.spellTags).reduce((obj, [k, p]) => {
			obj[k] = { label: game.i18n.localize(p.label), selected: context.system.tags.has(k) };
			return obj;
		}, {});

		context.activationOptions = CONFIG.BlackFlag.activationOptions({ chosen: context.system.casting.type });
		context.durationOptions = CONFIG.BlackFlag.durationOptions({
			chosen: context.system.duration.units,
			isSpell: true
		});
		context.range = { data: context.source.range };
		context.spellCircles = CONFIG.BlackFlag.spellCircles();
		context.target = { data: context.source.target };

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getSubmitData(updateData = {}) {
		const data = foundry.utils.expandObject(super._getSubmitData(updateData));

		if (foundry.utils.hasProperty(data, "system.components.required")) {
			data.system.components.required = filteredKeys(data.system.components.required);
		}

		if (foundry.utils.hasProperty(data, "system.tags")) {
			data.system.tags = filteredKeys(data.system.tags);
		}

		return foundry.utils.flattenObject(data);
	}
}
