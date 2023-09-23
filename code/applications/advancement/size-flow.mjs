import AdvancementFlow from "./advancement-flow.mjs";

/**
 * Inline application that presents a size choice.
 */
export default class SizeFlow extends AdvancementFlow {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/size-flow.hbs",
			submitOnChange: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		context.sizes = this.advancement.configuration.options.reduce((obj, key) => {
			obj[key] = CONFIG.BlackFlag.sizes[key].label;
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		this.advancement.apply(this.levels, formData.size);
	}
}

