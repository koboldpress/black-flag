/**
 * Abstract custom element that connects with a chat message.
 */
export default class MessageAssociatedElement extends HTMLElement {
	connectedCallback() {
		this.#message = game.messages.get(this.closest("[data-message-id]")?.dataset.messageId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reference to the chat message that contains this component.
	 * @type {BlackFlagChatMessage}
	 */
	#message;

	get message() {
		return this.#message;
	}
}
