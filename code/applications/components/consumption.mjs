/**
 * Custom element for displaying the list of consumption types on an activity.
 */
export default class ConsumptionElement extends HTMLElement {

	connectedCallback() {
		this.#app = ui.windows[this.closest(".app")?.dataset.appid];

		if ( !this.validTypes.length ) this.querySelector(".add-control").remove();

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
		return this.activity.item.testUserPermission(game.user, "EDIT");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Path on the activity of the consumption types collection property.
	 * @type {string}
	 */
	get #keyPath() {
		return this.name ?? "consumption.targets";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine which consumption types are still available for creation.
	 * @type {string[]}
	 */
	get validTypes() {
		const existingTypes = new Set(this.activity.consumption.targets.map(t => t.type));
		return Object.keys(CONFIG.BlackFlag.consumptionTypes).filter(t => !existingTypes.has(t));
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
		const event = new CustomEvent("consumption", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if ( target.dispatchEvent(event) === false ) return;

		const li = target.closest("[data-index]");
		const index = li?.dataset.index;
		const typesCollection = foundry.utils.getProperty(this.activity.toObject(), this.#keyPath) ?? [];
		if ( (action !== "add") && !index ) return;
		switch ( action ) {
			case "add":
				const validTypes = this.validTypes;
				if ( !validTypes.length ) return;
				typesCollection.push({type: validTypes[0]});
				break;
			case "delete":
				typesCollection.splice(index, 1);
				break;
			default:
				return;
		}

		return this.#app.submit({ updateData: { [this.#keyPath]: typesCollection }});
	}
}
