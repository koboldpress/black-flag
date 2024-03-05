import SelectChoices from "../../../documents/select-choices.mjs";
import { filteredKeys } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

export default class TypeConfig extends BaseConfig {

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "type"],
			template: "systems/black-flag/templates/actor/config/type-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get type() {
		return game.i18n.localize("BF.CreatureType.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		const type = context.source.traits.type ?? {};
		context.showSwarm = Object.hasOwn(this.document.system.traits.type, "swarm");
		context.tagOptions = new SelectChoices(CONFIG.BlackFlag.creatureTags, new Set(type.tags)).localize().sort();
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getSubmitData(...args) {
		const data = foundry.utils.expandObject(super._getSubmitData(...args));
		data.tags = filteredKeys(data.tags ?? {});
		return { "system.traits.type": data };
	}
}
