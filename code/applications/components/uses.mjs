/**
 * Custom element for displaying limited uses & recovery details.
 */
export default class UsesElement extends HTMLElement {

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
	 * Document represented by the app.
	 * @type {Activity|BlackFlagItem}
	 */
	get document() {
		return this.#app.activity ?? this.#app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Path on the activity of the consumption types collection property.
	 * @type {string}
	 */
	get #keyPath() {
		return this.attributes.name?.value ?? "system.uses";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine which recovery periods are still available for creation.
	 * @type {string[]}
	 */
	get validPeriods() {
		const recoveryCollection = foundry.utils.getProperty(this.document.toObject(), `${this.#keyPath}.recovery`);
		const existingPeriods = new Set(recoveryCollection?.map(r => r.period));
		return Object.keys(CONFIG.BlackFlag.recoveryPeriods).filter(p => !existingPeriods.has(p));
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
		const event = new CustomEvent("uses", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if ( target.dispatchEvent(event) === false ) return;

		const li = target.closest("[data-index]");
		const index = li?.dataset.index;
		const recoveryCollection = foundry.utils.getProperty(this.document.toObject(), `${this.#keyPath}.recovery`) ?? [];
		if ( (action !== "add") && !index ) return;
		switch ( action ) {
			case "add":
				const validPeriods = this.validPeriods;
				if ( !validPeriods.length ) return;
				recoveryCollection.push({
					period: validPeriods[0]
				});
				break;
			case "delete":
				recoveryCollection.splice(index, 1);
				break;
			default:
				return;
		}

		return this.#app.submit({ updateData: { [`${this.#keyPath}.recovery`]: recoveryCollection }});
	}
}
