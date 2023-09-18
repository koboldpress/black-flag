import AbilityAssignmentDialog from "./ability-assignment-dialog.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";

export default class PCSheet extends BaseActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "pc"],
			width: 820,
			height: 740,
			tabs: [
				{group: "progression", navSelector: ".progression", contentSelector: "form", initial: "front"},
				{group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: "main", initial: "main"}
			]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
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
					case "assign-abilities":
						return (new AbilityAssignmentDialog(this.actor)).render(true);
					case "select":
						if ( !properties.type ) return;
						return (new ConceptSelectionDialog(this.actor, properties.type)).render(true);
				}
		}
		return super._onAction(event);
	}
}
