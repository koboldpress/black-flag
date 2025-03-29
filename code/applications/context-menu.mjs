/**
 * Specialized ContextMenu class for displaying at mouse position.
 */
export default class BlackFlagContextMenu extends foundry.applications.ux.ContextMenu {
	/** @override */
	_setPosition(html, target, options) {
		html.classList.add("black-flag");
		return this._setFixedPosition(html, target, options);
	}
}
