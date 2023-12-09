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

	/**
	 * Reference to the application that contains this component.
	 * @type {Application}
	 */
	get app() {
		return this.#app;
	}
}
