import FormAssociatedElement from "./form-associated-element.mjs";

/**
 * Custom element for displaying the list of damages on an activity.
 */
export default class DamageListElement extends FormAssociatedElement {

	connectedCallback() {
		super.connectedCallback();

		const damageCollection = foundry.utils.getProperty(this.activity, this.name);

		if ( this.single ) {
			this.#toggleState(null, !!damageCollection?.custom);
		} else {
			for ( const li of this.querySelectorAll("[data-index]") ) {
				const damage = damageCollection?.[li.dataset.index];
				this.#toggleState(li.dataset.index, !!damage?.custom);
			}
		}

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
	 * Does this represent only a single entry, rather than a list?
	 * @type {boolean}
	 */
	get single() {
		return this.hasAttribute("single");
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

		const li = target.closest("li");
		const index = li?.dataset.index;
		const damageCollection = foundry.utils.getProperty(this.activity.toObject(), this.name) ?? [];

		switch ( action ) {
			case "add":
				damageCollection.push({});
				break;
			case "customize":
				if ( li.querySelector(".custom input").value ) {
					li.querySelector(".custom input").value = "";
					if ( this.single ) damageCollection.custom = "";
					else damageCollection[index].custom = "";
				} else {
					li.querySelector(".custom input").value = this.#createFormula(index);
					return this.#toggleState(index, true);
				}
				break;
			case "delete":
				damageCollection.splice(index, 1);
				break;
			default:
				return;
		}

		return this.app.submit({ updateData: { [this.name]: damageCollection }});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a formula based on the values at the given index.
	 * @param {number} index - Index of the damage entry within the damage collection.
	 * @returns {string} - Formula that can be used as the basis of a custom formula.
	 */
	#createFormula(index) {
		let damage = foundry.utils.getProperty(this.activity.toObject(), this.name);
		if ( !this.single ) damage = damage[index];
		if ( damage.denomination ) {
			const dice = `${damage.number || 1}d${damage.denomination}`;
			return damage.bonus ? `${dice} + ${damage.bonus}` : dice;
		}
		return damage.bonus ?? "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Change between normal editing mode & custom formula mode.
	 * @param {number} index - Index of the damage entry within the damage collection.
	 * @param {boolean} showCustomFormula - Should custom formula or normal controls be displayed?
	 */
	#toggleState(index, showCustomFormula) {
		const li = this.querySelector(this.single ? "li" : `[data-index="${index}"]`);

		const normal = ["die-count", "die-denomination", "plus", "bonus"];
		for ( const cls of normal ) {
			const element = li.querySelector(`.${cls}`);
			if ( showCustomFormula ) element?.classList.add("hidden");
			else element?.classList.remove("hidden");
		}

		const formulaElement = li.querySelector(".custom");
		if ( showCustomFormula ) formulaElement?.classList.remove("hidden");
		else formulaElement?.classList.add("hidden");

		const control = li.querySelector('[data-action="customize"]');
		if ( showCustomFormula ) control?.classList.add("active");
		else control?.classList.remove("active");
	}
}
