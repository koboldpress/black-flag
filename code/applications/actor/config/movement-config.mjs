import BaseConfig from "./base-config.mjs";

export default class MovementConfig extends BaseConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "movement"],
			template: "systems/black-flag/templates/actor/config/movement-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get type() {
		return game.i18n.localize("BF.Movement.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.types = Object.entries(CONFIG.BlackFlag.movementTypes).reduce((obj, [key, config]) => {
			const keyPath = `system.traits.movement.types.${key}`;
			obj[key] = {
				label: game.i18n.localize(config.label),
				value: context.source.traits.movement.types[key] ?? "",
				placeholder: foundry.utils.getProperty(this.document.overrides, keyPath)
					?? foundry.utils.getProperty(this.document.advancementOverrides, keyPath)
					?? ""
			};
			return obj;
		}, {});
		return context;
	}
}
