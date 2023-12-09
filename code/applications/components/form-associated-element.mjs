/**
 * Abstract custom element with some form internal architecture and app hookups.
 */
export default class FormAssociatedElement extends HTMLElement {

	static formAssociated = true;

	/* <><><><> <><><><> <><><><> <><><><> */

	constructor() {
		super();
		this.#internals = this.attachInternals();
		this.#name = this.getAttribute("name");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		this.#app = ui.windows[this.closest(".app")?.dataset.appid];
		if ( this.form ) {
			this.form.addEventListener("formdata", this.#formDataHandler);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	disconnectedCallback() {
		if ( this.form ) {
			this.form.removeEventListener("formdata", this.#formDataHandler);
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

	/**
	 * Reference to the application that contains this component.
	 * @type {Application}
	 */
	get app() {
		return this.#app;
	}

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

	#name;

	get name() {
		return this.#name;
	}

	set name(value) {
		this.#name = value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mutate form data upon submission.
	 * @param {FormDataEvent} event - The FormData event.
	 * @protected
	 */
	#onFormData(event) {
		const form = document.createElement("form");
		Array.from(this.children).forEach(c => form.insertAdjacentElement("beforeend", c));
		const formData = new FormDataExtended(form);
		this._mutateFormData(event, formData);
		for ( const [key, value] of formData.entries() ) {
			const name = this.name ? `${this.name}.${key}` : key;
			event.formData.delete(key);
			delete event.formData.object[key];
			event.formData.set(name, value);
		}
		if ( this.name ) {
			event.formData.delete(this.name);
			delete event.formData.object[this.name];
		}
		Array.from(form.children).forEach(c => this.insertAdjacentElement("beforeend", c));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mutate this form's FormData before merging with parent data.
	 * @param {FormDataEvent} event - The FormData event.
	 * @param {FormDataExtended} formData - Form data for just this element.
	 * @abstract
	 */
	_mutateFormData(event, formData) {}
}
