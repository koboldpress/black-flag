import AppAssociatedElement from "./app-associated-element.mjs";

export default class DocumentSheetAssociatedElement extends AppAssociatedElement {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document containing this inventory.
	 * @type {Document}
	 */
	get document() {
		return this.app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does the user have permission to edit the document?
	 * @type {boolean}
	 */
	get isEditable() {
		if (this.document.pack) {
			const pack = game.packs.get(this.document.pack);
			if (pack.locked) return false;
		}
		return this.document.testUserPermission(game.user, "EDIT");
	}
}
