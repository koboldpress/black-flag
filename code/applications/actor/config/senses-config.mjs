import { filteredKeys } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

export default class SensesConfig extends BaseConfig {

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "senses"],
			template: "systems/black-flag/templates/actor/config/senses-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get type() {
		return game.i18n.localize("BF.Senses.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		const senses = context.source.traits.senses ?? {};
		context.types = Object.entries(CONFIG.BlackFlag.senses).reduce((obj, [key, config]) => {
			const keyPath = `system.traits.senses.types.${key}`;
			obj[key] = {
				label: game.i18n.localize(config.label),
				value: senses.types?.[key] ?? "",
				placeholder: foundry.utils.getProperty(this.document.overrides, keyPath)
					?? foundry.utils.getProperty(this.document.advancementOverrides, keyPath)
					?? ""
			};
			return obj;
		}, {});
		context.tagOptions = Object.entries(CONFIG.BlackFlag.senseTags).reduce((obj, [key, config]) => {
			obj[key] = { label: game.i18n.localize(config.label), chosen: senses.tags?.includes(key) };
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getSubmitData(...args) {
		const data = foundry.utils.expandObject(super._getSubmitData(...args));
		data.tags = filteredKeys(data.tags ?? {});
		return { "system.traits.senses": data };
	}
}
