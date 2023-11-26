/**
 * Custom element for displaying the actions on the character sheet.
 */
export default class PCActionsElement extends HTMLElement {

	connectedCallback() {
		this.#app = ui.windows[this.closest(".app")?.dataset.appid];

		// Attach listeners to buttons
		for ( const button of this.querySelectorAll('[data-action="activate"]') ) {
			button.addEventListener("click", this.#onActivateAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reference to the application that contains this component.
	 * @type {Application}
	 */
	#app;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor that originates these actions.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.#app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking the use button on an action.
	 * @param {PointerEvent} event - Triggering click event.
	 */
	async #onActivateAction(event) {
		event.stopImmediatePropagation();
		const activityUuid = event.target.closest("[data-activity]").dataset.activity;
		const activity = await fromUuid(activityUuid);
		activity?.activate();
	}
}
