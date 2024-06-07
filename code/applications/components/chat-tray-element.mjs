import MessageAssociatedElement from "./message-associated-element.mjs";

/**
 * Element for displaying collapsible content in a chat message.
 */
export default class ChatTrayElement extends MessageAssociatedElement {
	static observedAttributes = ["open"];

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the tray expanded or collapsed?
	 * @type {boolean}
	 */
	get open() {
		return this.hasAttribute("open");
	}

	set open(open) {
		if (open) this.setAttribute("open", "");
		else this.removeAttribute("open");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	connectedCallback() {
		super.connectedCallback();
		this.querySelector(".collapsible")?.addEventListener("click", this._handleClickToggle.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	attributeChangedCallback(name, oldValue, newValue) {
		if (name === "open") this._handleToggleOpen(newValue !== null);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicks to the collapsible header.
	 * @param {PointerEvent} event - Triggering click event.
	 */
	_handleClickToggle(event) {
		if (!event.target.closest(".collapsible-content")) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.toggleAttribute("open");
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle changing the collapsed state of this element.
	 * @param {boolean} open - Is the element open?
	 */
	_handleToggleOpen(open) {
		this.dispatchEvent(new Event("toggle"));

		this.querySelector(".collapsible")?.classList.toggle("collapsed", !open);

		const popout = this.closest(".chat-popout");
		if (popout) popout.style.height = "";
	}
}
