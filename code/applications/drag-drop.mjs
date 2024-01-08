export default class DragDrop {

	/**
	 * Data about the ongoing drag event.
	 * @type {{event: DragEvent, data: *, document: Document}|null}
	 */
	static #currentDrag;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set the drag data for the current drag operation.
	 * @param {DragEvent} event - Current drag event.
	 * @param {Document|object} data - Data to add to the drag event, or a document that will get `toDragData` called.
	 */
	static beginDragEvent(event, data) {
		let doc;
		if ( foundry.utils.getType(data?.toDragData) === "function" ) {
			doc = data;
			data = doc.toDragData();
		} else {
			data = JSON.parse(data);
		}
		this.#currentDrag = { event, data, document: doc };
		event.dataTransfer.setData("text/plain", JSON.stringify(data));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mark a drag event as complete and clear the stored data.
	 * @param {DragEvent} event - Event that triggered the completion.
	 */
	static finishDragEvent(event) {
		this.#currentDrag = null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve the drag data for the provided drag operation.
	 * @param {DragEvent} event - Drag event for which to fetch data.
	 * @returns {{data: *, document: Document}}
	 */
	static getDragData(event) {
		if ( this.#currentDrag ) return { data: this.#currentDrag.data, document: this.#currentDrag.document };
		const data = TextEditor.getDragEventData(event);
		return foundry.utils.isEmpty(data) ? {} : { data };
	}
}
