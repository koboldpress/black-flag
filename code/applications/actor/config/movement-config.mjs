import { filteredKeys } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

export default class MovementConfig extends BaseConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "movement"],
			template: "systems/black-flag/templates/actor/config/movement-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get type() {
		return game.i18n.localize("BF.Movement.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		const movement = context.source.traits.movement ?? {};
		context.types = Object.entries(CONFIG.BlackFlag.movementTypes).reduce((obj, [key, config]) => {
			const keyPath = `system.traits.movement.types.${key}`;
			obj[key] = {
				label: game.i18n.localize(config.label),
				value: movement.types?.[key] ?? "",
				placeholder:
					foundry.utils.getProperty(this.document.overrides, keyPath) ??
					foundry.utils.getProperty(this.document.advancementOverrides, keyPath) ??
					""
			};
			return obj;
		}, {});
		context.tagOptions = Object.entries(CONFIG.BlackFlag.movementTags).reduce((obj, [key, config]) => {
			obj[key] = { label: game.i18n.localize(config.label), chosen: movement.tags?.includes(key) };
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
		return { "system.traits.movement": data };
	}
}
