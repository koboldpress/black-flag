import { ConsumptionTargetData } from "../../data/activity/fields/consumption-targets-field.mjs";
import FormAssociatedElement from "./form-associated-element.mjs";

/**
 * Custom element for displaying the list of consumption types on an activity.
 */
export default class ConsumptionElement extends FormAssociatedElement {
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
		if (!this.isEditable || target.dispatchEvent(event) === false) return;

		const li = target.closest("[data-index]");
		const index = li?.dataset.index;
		const typesCollection = foundry.utils.getProperty(this.activity.toObject(), this.#keyPath) ?? [];
		if (action !== "add" && !index) return;
		switch (action) {
			case "add":
				const types = this.activity.validConsumptionTypes;
				const filteredTypes = types.difference(
					new Set(foundry.utils.getProperty(this.activity.toObject(), this.#keyPath).map(t => t.type))
				);
				const type = filteredTypes.first() ?? types.first();
				if (!type) return;
				typesCollection.push({
					type,
					target: ConsumptionTargetData.getValidTargets(type, this.activity)?.[0]?.value
				});
				break;
			case "delete":
				typesCollection.splice(index, 1);
				break;
			default:
				return;
		}

		return this.app.submit({ updateData: { [this.#keyPath]: typesCollection } });
	}
}
