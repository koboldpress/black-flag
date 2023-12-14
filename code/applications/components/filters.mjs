import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying a grouped set of inventory filters.
 */
export default class FiltersElement extends AppAssociatedElement {

	constructor() {
		super();
		this.#tab = this.getAttribute("tab");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();
		if ( this.app.filters ) this.app.filters[this.tab] ??= {};
		this.addEventListener("change", this.#onChangeFilter.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set of filters offered by the app.
	 * @type {{[key: string]: integer}|null}
	 */
	get filters() {
		return this.app.filters?.[this.tab] ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Tab that these filters affect.
	 * @type {string}
	 */
	#tab;

	get tab() {
		return this.#tab;
	}

	set tab(value) {
		this.#tab = value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a change to one of the included filters.
	 * @param {Event} event - Triggering change event.
	 */
	#onChangeFilter(event) {
		event.stopPropagation();
		if ( !this.filters ) return;
		this.filters[event.target.filter] = event.target.value;
		this.app.render();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve the current value of the specified filter.
	 * @param {string} filter - Filtering key.
	 * @returns {number|undefined} - Valid filter value (-1, 0, or +1).
	 */
	getValueOf(filter) {
		return this.filters?.[filter];
	}
}
