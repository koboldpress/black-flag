import * as Trait from "../../utils/trait.mjs";
import AdvancementFlow from "./advancement-flow.mjs";

/**
 * Inline application that presents a trait choice.
 */
export default class TraitFlow extends AdvancementFlow {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/trait-flow.hbs",
			submitOnChange: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		const { choices, label } = this.advancement.availableChoices() ?? {};
		context.availableChoices = choices ?? {};
		context.blankLabel = label;
		context.chosen = this.advancement.value.selected?.map(key => ({
			key, label: Trait.keyLabel(key)
		}));
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll('[data-action="remove-choice"]') ) {
			element.addEventListener("click", e => {
				const key = e.target.closest("[data-key]").dataset.key;
				this.advancement.reverse(this.levels, key);
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		if ( formData.added ) this.advancement.apply(this.levels, new Set([formData.added]));
	}
}
