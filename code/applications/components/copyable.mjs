/**
 * Bit of text with a button after it for copying it.
 */
export default class CopyableElement extends HTMLElement {
	/** @override */
	connectedCallback() {
		const button = document.createElement("button");
		button.ariaLabel = this.getAttribute("label") ?? game.i18n.localize("BF.Copy.Action");
		button.classList.add("copy-button", "link-button");
		button.dataset.tooltip = button.ariaLabel;
		button.innerHTML = '<i class="fa-regular fa-clipboard" inert></i>';
		button.addEventListener("click", this._onClick.bind(this));
		this.append(button);
	}

	/* -------------------------------------------- */

	/** @override */
	disconnectedCallback() {
		this.querySelector("button")?.remove();
	}

	/* -------------------------------------------- */

	/**
	 * Handle copying the contents.
	 * @param {PointerEvent} event - Triggering click event.
	 */
	_onClick(event) {
		event.preventDefault();
		event.stopPropagation();
		const value = this.getAttribute("value") ?? this.innerText;
		game.clipboard.copyPlainText(value);
		game.tooltip.activate(event.target, { text: game.i18n.format("BF.Copy.Complete", { value }), direction: "UP" });
	}
}
