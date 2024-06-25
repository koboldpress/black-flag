import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying sorting options on inventories.
 */
export default class SortingElement extends AppAssociatedElement {
	constructor() {
		super();
		this.#tab = this.getAttribute("tab");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();
		this.#controller = new AbortController();
		for (const input of this.querySelectorAll('input[type="radio"]')) {
			input.name ??= `${this.tab}-sort`;
			if (input.value === this.sorting) input.checked = true;
		}
		this.addEventListener("change", this.#onChangeSorting.bind(this), { signal: this.#controller.signal });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	disconnectedCallback() {
		this.#controller.abort();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Controller for handling removal of event listeners.
	 * @type {AbortController}
	 */
	#controller;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document represented by the app.
	 * @type {BlackFlagActor|BlackFlagItem}
	 */
	get document() {
		return this.app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the current sorting value for this tab.
	 * @type {string}
	 */
	get sorting() {
		return this.app.document.flags["black-flag"]?.sheet?.sorting?.[this.tab] ?? "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Tab that this sorting affects.
	 * @type {string}
	 */
	#tab;

	get tab() {
		return this.#tab ?? this.closest("blackFlag-inventory").tab;
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
	#onChangeSorting(event) {
		event.stopPropagation();
		this.document.update({ [`flags.black-flag.sheet.sorting.${this.tab}`]: event.target.value });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort items within a section based on the sorting mode.
	 * @param {BlackFlagItem[]} items - List of items to sort.
	 * @param {string} sortingMode - Sorting mode to apply.
	 * @returns {BlackFlagItem[]} - Sorted items.
	 */
	static sort(items, sortingMode) {
		switch (sortingMode) {
			case "alpha":
				return items.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
			case "currency":
				const conv = i => CONFIG.BlackFlag.currencies[i.identifier]?.conversion ?? 1;
				return items.sort((lhs, rhs) => conv(rhs) - conv(lhs));
			default:
				return items.sort((lhs, rhs) => lhs.sort - rhs.sort);
		}
	}
}
