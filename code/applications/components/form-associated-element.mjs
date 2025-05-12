import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Abstract custom element with some form internal architecture and app hookups.
 */
export default class FormAssociatedElement extends AppAssociatedElement {
	static formAssociated = true;

	/* <><><><> <><><><> <><><><> <><><><> */

	constructor() {
		super();
		this.#internals = this.attachInternals();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();
		if (this.form) {
			this.form.addEventListener("formdata", this.#formDataHandler);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	disconnectedCallback() {
		if (this.form) {
			this.form.removeEventListener("formdata", this.#formDataHandler);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Internal form interaction implementation.
	 * @type {ElementInternals}
	 */
	#internals;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The bound form data handler method.
	 * @type {Function}
	 */
	#formDataHandler = this.#onFormData.bind(this);

	/**
	 * Form associated with this control.
	 * @type {HTMLFormElement}
	 */
	get form() {
		return this.#internals.form;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get name() {
		return this.getAttribute("name");
	}

	set name(value) {
		this.setAttribute("name", value);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get value() {
		return this.#createValue();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this element disabled?
	 * @type {boolean}
	 */
	get disabled() {
		return this.hasAttribute("disabled");
	}

	set disabled(value) {
		this.toggleAttribute("disabled", value);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove remapped for field upon submission.
	 * @param {FormDataEvent} event - The FormData event.
	 * @protected
	 */
	#onFormData(event) {
		for (const field of this.querySelectorAll('[name^="$"]')) {
			event.formData.delete(field.name);
			delete event.formData.object[field.name];
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	#createValue() {
		const form = document.createElement("form");
		Array.from(this.children).forEach(c => form.insertAdjacentElement("beforeend", c));
		const formData = new (foundry.applications?.ux?.FormDataExtended ?? FormDataExtended)(form);
		Array.from(form.children).forEach(c => this.insertAdjacentElement("beforeend", c));
		let object = foundry.utils.expandObject(formData.object).$ ?? {};
		object = this._mutateFormData(object) ?? object;
		return object;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mutate this form's FormData before merging with parent data.
	 * @param {object} object - Form data for just this element.
	 * @returns {*}
	 * @abstract
	 */
	_mutateFormData(object) {}
}
