import AdvancementFlow from "./advancement-flow.mjs";

/**
 * Inline application that presents a key ability choice.
 */
export default class KeyAbilityFlow extends AdvancementFlow {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/key-ability-flow.hbs",
			submitOnChange: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		context.abilities = this.advancement.configuration.options.reduce((obj, key) => {
			obj[key] = CONFIG.BlackFlag.abilities[key].labels.full;
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		this.advancement.apply(this.levels, formData.ability);
	}
}
