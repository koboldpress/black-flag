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
		context.custom = type.custom;
		context.showSwarm = Object.hasOwn(this.document.system.traits.type, "swarm");
		context.tagOptions = new SelectChoices(CONFIG.BlackFlag.creatureTags, new Set(type.tags)).localize().sort();
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		html.querySelector('[data-action="add"]').addEventListener("click", event =>
			this.submit({ updateData: { newCustom: true } })
		);

		for ( const control of html.querySelectorAll('[data-action="delete"]') ) {
			control.addEventListener("click", event =>
				this.submit({ updateData: { deleteCustom: Number(event.currentTarget.dataset.index) } })
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getSubmitData(...args) {
		const data = foundry.utils.expandObject(super._getSubmitData(...args));
		console.log(foundry.utils.deepClone(data));
		data.type ??= {};
		data.type.tags = filteredKeys(data.type?.tags ?? {});

		const custom = Array.from(Object.values(data.custom ?? {}));
		if ( data.deleteCustom !== undefined ) custom.splice(data.deleteCustom, 1);
		if ( data.newCustom ) custom.push("");

		return { "system.traits": {
			size: data.size,
			type: {
				...data.type,
				custom
			}
		} };
	}
}
