import BaseConfig from "./base-config.mjs";

export default class SensesConfig extends BaseConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "senses"],
			template: "systems/black-flag/templates/actor/config/senses-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get type() {
		return game.i18n.localize("BF.Senses.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.types = Object.entries(CONFIG.BlackFlag.senses).reduce((obj, [key, config]) => {
			const keyPath = `system.traits.senses.types.${key}`;
			obj[key] = {
				label: game.i18n.localize(config.label),
				value: context.source.traits.senses.types[key] ?? "",
				placeholder: foundry.utils.getProperty(this.document.overrides, keyPath)
					?? foundry.utils.getProperty(this.document.advancementOverrides, keyPath)
					?? ""
			};
			return obj;
		}, {});
		return context;
	}
}
