import { numberFormat } from "../../utils/_module.mjs";
import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying and rolling death saves.
 */
export default class DeathSavesElement extends AppAssociatedElement {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor represented by the app.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Death saving information on the actor.
	 * @type {object}
	 */
	get death() {
		return this.actor.system.attributes.death;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();

		const buttons = [];
		for ( const type of ["failure", "success"] ) {
			const key = `BF.Death.${type.capitalize()}`;
			for ( const number of Array.fromRange(3, 1) ) {
				const n = type === "failure" ? 4 - number : number;
				buttons.push({
					classes: type,
					n,
					filled: this.death[type] >= n,
					tooltip: `${key}.Label`,
					label: game.i18n.format(`${key}.Count`, { count: numberFormat(n, { ordinal: true }) })
				});
			}
		}

		const makeButton = b => `
			<button type="button" class="${b.classes}" data-n="${b.n}" data-tooltip="${b.tooltip}"
			  aria-label="${b.label}" aria-pressed="${b.filled}"></button>
		`;
		this.insertAdjacentHTML("afterbegin", `
			<button type="button" data-action="roll" aria-label="roll death save">
				<blackFlag-icon src="systems/black-flag/artwork/interface/death-save.svg"></blackFlag-icon>
			</button>
			<div class="levels">
				${buttons.map(b => makeButton(b)).join("")}
			</div>
			<slot></slot>
		`);

		this.querySelector('[data-action="roll"]').addEventListener("click", this._onRoll.bind(this));
		for ( const button of this.querySelectorAll(".levels button") ) {
			button.addEventListener("click", this._onModifySuccessFailure.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle rolling a death save.
	 * @param {PointerEvent} event - Triggering click event.
	 */
	_onRoll(event) {
		event.stopImmediatePropagation();
		this.actor.rollDeathSave();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking one of the success/failure buttons.
	 * @param {PointerEvent} event - Triggering click event.
	 */
	_onModifySuccessFailure(event) {
		const type = event.target.classList.contains("success") ? "success" : "failure";
		const n = Number(event.target.dataset.n);
		const newValue = this.death[type] === n ? this.death[type] - 1 : n;
		this.actor.update({[`system.attributes.death.${type}`]: newValue});
	}
}
