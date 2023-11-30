import BaseConfig from "./base-config.mjs";

export default class TypeConfig extends BaseConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "type"],
			template: "systems/black-flag/templates/actor/config/type-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/* <><><><> <><><><> <><><><> <><><><> */

	get type() {
		return game.i18n.localize("BF.CreatureType.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.showSwarm = Object.hasOwn(this.document.system.traits.type, "swarm");
		return context;
	}
}
