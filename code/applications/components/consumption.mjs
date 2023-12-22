import ConsumptionTargetData from "../../data/activity/consumption-target-data.mjs";
import FormAssociatedElement from "./form-associated-element.mjs";

/**
 * Custom element for displaying the list of consumption types on an activity.
 */
export default class ConsumptionElement extends FormAssociatedElement {

	connectedCallback() {
		super.connectedCallback();

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
	 * Activity represented by the app.
	 * @type {Activity}
	 */
	get activity() {
		return this.app.activity;
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
	 * Path on the activity of the consumption targets collection property.
	 * @type {string}
	 */
	get #keyPath() {
		return `${this.name ?? "consumption"}.targets`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine which consumption types are still available for creation.
	 * @type {string[]}
	 */
	get validTypes() {
		const existingTypes = new Set(foundry.utils.getProperty(this.activity.toObject(), this.#keyPath).map(t => t.type));
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
		if ( !this.isEditable || (target.dispatchEvent(event) === false) ) return;

		const li = target.closest("[data-index]");
		const index = li?.dataset.index;
		const typesCollection = foundry.utils.getProperty(this.activity.toObject(), this.#keyPath) ?? [];
		if ( (action !== "add") && !index ) return;
		switch ( action ) {
			case "add":
				const validTypes = this.validTypes;
				if ( !validTypes.length ) return;
				typesCollection.push({
					type: validTypes[0],
					target: ConsumptionTargetData.getValidTargets(validTypes[0], this.activity)?.[0]?.key
				});
				break;
			case "delete":
				typesCollection.splice(index, 1);
				break;
			default:
				return;
		}

		return this.app.submit({ updateData: { [this.#keyPath]: typesCollection }});
	}
}
