/**
 * Custom element for displaying the list of damages on an activity.
 */
export default class DamageListElement extends HTMLElement {

	connectedCallback() {
		this.#app = ui.windows[this.closest(".app")?.dataset.appid];

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this.#onAction(event.currentTarget, event.currentTarget.dataset.action);
			});
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
	 * Activity represented by the app.
	 * @type {Activity}
	 */
	get activity() {
		return this.#app.activity;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does the user have permission to edit the document?
	 * @type {boolean}
	 */
	get isEditable() {
		return this.document.testUserPermission(game.user, "EDIT");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle one of the actions from the buttons or context menu.
	 * @param {Element} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise|void}
	 */
	#onAction(target, action) {
		const event = new CustomEvent("damage", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if ( target.dispatchEvent(event) === false ) return;

		const index = target.closest("[data-index]")?.dataset.index;
		const keyPath = this.name ?? "system.damage.parts";
		const damageCollection = foundry.utils.getProperty(this.activity.toObject(), keyPath) ?? [];
		if ( (action !== "add") && !index ) return;
		switch ( action ) {
			case "add":
				damageCollection.push({});
				break;
			case "delete":
				damageCollection.splice(index, 1);
				break;
			default:
				return;
		}

		return this.#app.submit({ updateData: { [keyPath]: damageCollection }});
	}
}
