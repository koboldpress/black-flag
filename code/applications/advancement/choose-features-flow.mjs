import AdvancementFlow from "./advancement-flow.mjs";
import ChooseFeaturesDialog from "./choose-features-dialog.mjs";

/**
 * Inline application that presents a list of feature choices.
 */
export default class ChooseFeaturesFlow extends AdvancementFlow {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/choose-features-flow.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData() {
		const context = super.getData();
		const level = this.advancement.relavantLevel(this.levels);
		context.chosen = (this.advancement.value.added?.[level] ?? []).map(a => a.document);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll('[data-action="remove-choice"]')) {
			element.addEventListener("click", e => {
				const id = e.target.closest("[data-id]").dataset.id;
				this.advancement.reverse(this.levels, id);
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _updateObject(event, formData) {
		if (event.submitter?.dataset.action === "select-choice") {
			let choice;
			try {
				const promise = new Promise((resolve, reject) => {
					new ChooseFeaturesDialog(this, { resolve, reject }).render(true);
				});
				choice = await promise;
			} catch (err) {
				return;
			}
			return this.advancement.apply(this.levels, { choices: [choice] });
		}
	}
}
