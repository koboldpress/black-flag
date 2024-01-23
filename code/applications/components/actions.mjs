import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying the actions on the actor sheets.
 */
export default class ActionsElement extends AppAssociatedElement {

	connectedCallback() {
		super.connectedCallback();

		// Attach listeners to buttons
		for ( const button of this.querySelectorAll("[data-action]") ) {
			button.addEventListener("click", this.#onAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor that originates these actions.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking an action.
	 * @param {PointerEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async #onAction(event) {
		event.stopImmediatePropagation();
		const dataset = event.currentTarget.closest("tr")?.dataset;
		const activityUuid = dataset?.activity;
		const activity = await fromUuid(activityUuid);
		if ( !activity ) return this.app._onAction?.(event, dataset);

		switch ( event.currentTarget.dataset.action ) {
			case "activate":
				return activity.activate();
			case "edit":
				return activity.sheet.render(true);
		}
	}
}
