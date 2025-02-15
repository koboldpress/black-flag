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
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.effects = EffectsElement.prepareItemContext(this.item.effects);

		const has = (data, key) => data?.includes?.(key) ?? data?.has?.(key);

		context.components = Object.entries(CONFIG.BlackFlag.spellComponents).reduce((obj, [k, p]) => {
			obj[k] = { label: game.i18n.localize(p.label), selected: has(context.source.components.required, k) };
			return obj;
		}, {});

		context.tags = Object.entries(CONFIG.BlackFlag.spellTags).reduce((obj, [k, p]) => {
			obj[k] = { label: game.i18n.localize(p.label), selected: has(context.source.tags, k) };
			return obj;
		}, {});

		context.data = {
			range: context.source.range,
			target: context.source.target
		};
		context.activationOptions = CONFIG.BlackFlag.activationOptions({ chosen: context.source.casting.type });
		context.durationOptions = CONFIG.BlackFlag.durationOptions({
			chosen: context.source.duration.units,
			isSpell: true
		});
		context.originOptions = [
			{ value: "", label: "" },
			...Object.entries(CONFIG.BlackFlag.registration.list("class")).map(([value, data]) => ({
				value,
				label: data.name,
				group: game.i18n.localize("BF.Item.Type.Class[other]")
			})),
			...Object.entries(CONFIG.BlackFlag.registration.list("subclass")).map(([value, data]) => ({
				value,
				label: data.name,
				group: game.i18n.localize("BF.Item.Type.Subclass[other]")
			}))
		];
		context.rangeOptions = [
			{ value: "", label: "" },
			{ rule: true },
			...CONFIG.BlackFlag.rangeTypes.localizedOptions,
			...CONFIG.BlackFlag.distanceUnits.localizedOptions.map(o => ({
				...o,
				group: game.i18n.localize("BF.Distance.Label")
			}))
		];
		context.spellCircles = CONFIG.BlackFlag.spellCircles();

		context.showConfiguration = this.item.isEmbedded && !this.item.getFlag(game.system.id, "cachedFor");

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
