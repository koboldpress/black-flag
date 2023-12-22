/**
 * Abstract custom element that connects with a Foundry application.
 */
export default class AppAssociatedElement extends HTMLElement {

	connectedCallback() {
		this.#app = ui.windows[this.closest(".app")?.dataset.appid];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reference to the application that contains this component.
	 * @type {Application}
	 */
	#app;

	get app() { return this.#app; }

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can the contents of the associated app be edited?
	 * @type {boolean}
	 */
	get isEditable() {
		return this.app.isEditable ?? true;
	}
}
