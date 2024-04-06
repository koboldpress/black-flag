import FormAssociatedElement from "./form-associated-element.mjs";

/**
 * Custom element for displaying limited uses & recovery details.
 */
export default class UsesElement extends FormAssociatedElement {
	connectedCallback() {
		super.connectedCallback();

		for (const element of this.querySelectorAll("[data-action]")) {
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
	 * Document represented by the app.
	 * @type {Activity|BlackFlagItem}
	 */
	get document() {
		return this.app.activity ?? this.app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine which recovery periods are still available for creation.
	 * @type {string[]}
	 */
	get validPeriods() {
		const recoveryCollection = foundry.utils.getProperty(this.document.toObject(), `${this.name}.recovery`);
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
		if (!this.isEditable || target.dispatchEvent(event) === false) return;

		const li = target.closest("[data-index]");
		const index = li?.dataset.index;
		const recoveryCollection = foundry.utils.getProperty(this.document.toObject(), `${this.name}.recovery`) ?? [];
		if (action !== "add" && !index) return;
		switch (action) {
			case "add":
				const validPeriods = this.validPeriods;
				if (!validPeriods.length) return;
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

		return this.app.submit({ updateData: { [`${this.name}.recovery`]: recoveryCollection } });
	}
}
