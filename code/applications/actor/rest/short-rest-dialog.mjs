import BaseRestDialog from "./base-rest-dialog.mjs";

export default class ShortRestDialog extends BaseRestDialog {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/actor/rest/short-rest.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll('[data-action="roll-hit-die"]')) {
			element.addEventListener("click", event => {
				event.preventDefault();
				this.actor.rollHitDie({ denomination: event.currentTarget.dataset.denomination }).then(r => this.render());
			});
		}
	}
}
