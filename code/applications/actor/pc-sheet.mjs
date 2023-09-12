import log from "../../utils/logging.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";

export default class PCSheet extends ActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "pc"],
			width: 820,
			height: 740,
			tabs: [
				{group: "progression", navSelector: ".progression", contentSelector: "form", initial: "front"},
				{group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: "main", initial: "main"}
			],
			template: "systems/black-flag/templates/actor/pc.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.system = this.document.system;
		context.source = this.document.toObject().system;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", this._onAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a click on an action link.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async _onAction(event) {
		const { action, subAction, ...properties } = event.currentTarget.dataset;
		switch (action) {
			case "progression":
				switch (subAction) {
					case "select":
						if ( !properties.type ) return;
						return (new ConceptSelectionDialog(this.actor, properties.type)).render(true);
					default: break;
				}
		}
		return log(`Unrecognized action: ${action}`, { level: "warn" });
	}
}
