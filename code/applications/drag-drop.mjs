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
		if (foundry.utils.getType(data?.toDragData) === "function") {
			doc = data;
			data = doc.toDragData();
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
	 * @typedef {object} DragEventData
	 * @property {any} data - Drag event payload.
	 * @property {Document} [document] - Dragged document if available.
	 */

	/**
	 * Retrieve the drag data for the provided drag operation.
	 * @param {DragEvent} event - Drag event for which to fetch data.
	 * @returns {DragEventPayload}
	 */
	static getDragData(event) {
		const data = TextEditor.getDragEventData(event);
		if (!foundry.utils.isEmpty(data)) return { data };
		if (this.#currentDrag?.data) return { data: this.#currentDrag.data, document: this.#currentDrag.document };
		return {};
	}
}
