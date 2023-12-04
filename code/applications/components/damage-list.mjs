/**
 * Custom element for displaying the list of damages on an activity.
 */
export default class DamageListElement extends HTMLElement {

	connectedCallback() {
		this.#app = ui.windows[this.closest(".app")?.dataset.appid];

		const damageCollection = foundry.utils.getProperty(this.activity, this.#keyPath);
		for ( const li of this.querySelectorAll("[data-index]") ) {
			const damage = damageCollection?.[li.dataset.index];
			this.#toggleState(li.dataset.index, !!damage?.custom);
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

	/**
	 * Path on the activity of the damage collection property.
	 * @type {string}
	 */
	get #keyPath() {
		return this.name ?? "system.damage.parts";
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

		const li = target.closest("[data-index]");
		const index = li?.dataset.index;
		const damageCollection = foundry.utils.getProperty(this.activity.toObject(), this.#keyPath) ?? [];
		if ( (action !== "add") && !index ) return;
		switch ( action ) {
			case "add":
				damageCollection.push({});
				break;
			case "customize":
				if ( li.querySelector(".custom input").value ) {
					li.querySelector(".custom input").value = "";
					damageCollection[index].custom = "";
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

		return this.#app.submit({ updateData: { [this.#keyPath]: damageCollection }});
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
		const damage = foundry.utils.getProperty(this.activity.toObject(), this.#keyPath)?.[index];
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
		const li = this.querySelector(`[data-index="${index}"]`);

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
