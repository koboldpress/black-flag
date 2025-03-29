import BaseRestDialog from "./base-rest-dialog.mjs";

export default class ShortRestDialog extends BaseRestDialog {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			rollHitDie: ShortRestDialog.#rollHitDie
		},
		classes: ["short-rest"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		content: {
			template: "systems/black-flag/templates/actor/rest/short-rest.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle rolling a hit die.
	 * @this {ShortRestDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #rollHitDie(event, target) {
		const denomination = target.dataset.denomination;
		await this.actor.rollHitDie({ denomination });
		foundry.utils.mergeObject(this.config, new foundry.applications.ux.FormDataExtended(this.form).object);
		this.render();
	}
}
