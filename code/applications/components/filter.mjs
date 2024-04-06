import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying a single inventory filter.
 */
export default class FilterElement extends AppAssociatedElement {
	static formAssociated = true;

	/* <><><><> <><><><> <><><><> <><><><> */

	constructor() {
		super();
		this.#controller = new AbortController();
		this.#filter = this.getAttribute("filter");
		this.#internals = this.attachInternals();
		this.#shadowRoot = this.attachShadow({ mode: "closed" });
		if (this.hasAttribute("value")) this.#value = this.getAttribute("value");

		const style = document.createElement("style");
		style.innerText = `
		  :host {
				--filter-indicator-display: inline-block;
				--filter-indicator-size: 0.5em;
				--filter-indicator-border-color: currentcolor;
				--filter-indicator-border: 1px solid var(--filter-indicator-border-color);
				--filter-indicator-positive-color: #5cff5c;
				--filter-indicator-negative-color: #ff6767;
				--filter-indicator-text-color: black;
			}
			:host > .frame {
				position: relative;
				display: var(--filter-indicator-display);
				width: var(--filter-indicator-size);
				height: var(--filter-indicator-size);
				border: var(--filter-indicator-border);
				border-radius: var(--filter-indicator-size);
				&[data-value="-1"] { background-color: var(--filter-indicator-negative-color); }
				&[data-value="1"] { background-color: var(--filter-indicator-positive-color); }

				> span {
					position: absolute;
					inset: 0;
					inset-block-start: -1px;
					display: grid;
					place-content: center;
					color: var(--filter-indicator-text-color);
					font-size: 0.8em;
					font-weight: 100;
					text-shadow: none;
				}
			}
		`;
		this.#shadowRoot.appendChild(style);

		const span = document.createElement("span");
		span.classList.add("frame");
		this.#shadowRoot.appendChild(span);
		const text = document.createElement("span");
		text.classList.add("text");
		span.appendChild(text);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();
		this.#filters = this.closest("blackFlag-filters");
		this.#value = this.#filters?.getValueOf(this.#filter);
		this.#matchInternalState();

		if (!this.hasAttribute("name")) this.setAttribute("name", this.name);

		this.addEventListener("click", this.#onClick.bind(this), { signal: this.#controller.signal });
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
	 * Form that contains this control.
	 * @type {HTMLFormElement}
	 */
	get form() {
		return this.#internals.form;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Name of the filter targeted by this control.
	 * @type {string}
	 */
	#filter;

	get filter() {
		return this.#filter;
	}

	set filter(value) {
		this.#filter = value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reference to the containing <blackFlag-filters> element.
	 * @type {FiltersElement}
	 */
	#filters;

	get filters() {
		return this.#filters;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Internal element implementation.
	 * @type {ElementInternals}
	 */
	#internals;

	/* <><><><> <><><><> <><><><> <><><><> */

	get name() {
		return `filters.${this.filters?.tab}.${this.filter}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Shadow root.
	 * @type {ShadowRoot}
	 */
	#shadowRoot;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Value of this filter. Can be `0` (no filter), `+1` (only items that match), or `-1` (no items that match).
	 * @type {number}
	 */
	#value;

	get value() {
		return this.#value;
	}

	set value(value) {
		value = parseInt(value);
		if (![-1, 0, 1].includes(value)) throw new Error("Filter value must be -1, 0, or +1.");
		this.#value = value;
		this.#matchInternalState();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set the internal styling to match the current value.
	 */
	#matchInternalState() {
		this.#internals.setFormValue(this.#value ?? 0);
		this.#shadowRoot.querySelector(".frame").dataset.value = this.#value ?? 0;
		this.#shadowRoot.querySelector(".text").innerText = this.#value === 1 ? "+" : this.#value === -1 ? "-" : "";
		this.setAttribute("value", this.#value ?? 0);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking on the control.
	 * @param {PointerEvent} event - The triggering click event.
	 */
	#onClick(event) {
		if (this.value === 1) this.value = -1;
		else this.value = (this.value ?? 0) + 1;
		this.dispatchEvent(new Event("change", { bubbles: true }));
	}
}
