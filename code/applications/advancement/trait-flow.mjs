import * as Trait from "../../utils/trait.mjs";
import AdvancementFlow from "./advancement-flow.mjs";

/**
 * Inline application that presents a trait choice.
 */
export default class TraitFlow extends AdvancementFlow {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			removeChoice: TraitFlow.#removeChoice
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		content: {
			...super.PARTS.content,
			template: "systems/black-flag/templates/advancement/trait-flow-content.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContentContext(context, options) {
		context = await super._prepareContentContext(context, options);
		const { choices, label } = this.advancement.availableChoices() ?? {};
		context.availableChoices = choices ?? {};
		context.blankLabel = label;
		context.chosen = this.advancement.value.selected?.map(key => ({
			key,
			label: Trait.keyLabel(key)
		}));
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing an improvement choice.
	 * @this {TraitFlow}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #removeChoice(event, target) {
		const key = target.closest("[data-key]").dataset.key;
		this.advancement.reverse(this.levels, { key });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _handleForm(event, formData) {
		if (formData.object.added) this.advancement.apply(this.levels, new Set([formData.object.added]));
	}
}
