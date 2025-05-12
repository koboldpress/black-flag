/**
 * Specialized ContextMenu class for displaying at mouse position.
 */
export default class BlackFlagContextMenu extends (foundry.applications?.ux?.ContextMenu ?? ContextMenu) {
	/** @override */
	_setPosition(html, target, options) {
		if (game.release.generation > 12) {
			html.classList.add("black-flag");
			return this._setFixedPosition(html, target, options);
		}

		html = html[0];
		target = target[0];

		document.body.appendChild(html);
		const { clientWidth, clientHeight } = document.documentElement;
		const { width, height } = html.getBoundingClientRect();

		const { clientX, clientY } = window.event;
		const left = Math.min(clientX, clientWidth - width);
		this._expandUp = clientY + height > clientHeight;
		html.classList.add("black-flag");
		html.classList.toggle("expand-up", this._expandUp);
		html.classList.toggle("expand-down", !this._expandUp);
		html.style.visibility = "";
		html.style.insetInlineStart = `${left}px`;
		if (this._expandUp) html.style.insetBlockEnd = `${clientHeight - clientY}px`;
		else html.style.insetBlockStart = `${clientY}px`;
		target.classList.add("context");
	}
}
