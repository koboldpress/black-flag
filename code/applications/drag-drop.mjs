export default class DragDrop {
	/**
	 * Data about the ongoing drag event.
	 * @type {{event: DragEvent, data: *, document: Document}|null}
	 */
	static #currentDrag;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Tracking rect for the current drag area.
	 * @
	 */
	static #rect;

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
	 * Begin tracking a drop area.
	 * @param {DragEvent} event - Event that triggered the enter.
	 * @param {HTMLElement} area - Drop area to be tracked.
	 */
	static enterDragArea(event, area) {
		this.#currentDrag ??= {};
		this.#currentDrag.area = area;
		this.#rect = area.getBoundingClientRect();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Trigger an event if the drag area has been departed. Clear the drag after after calling the callback unless it
	 * returns `false`.
	 * @param {DragEvent} event - Event that triggered the exit.
	 * @param {Function} callback - Method to call if the mouse is outside the area.
	 * @returns {boolean} - Indicate whether the area has been departed.
	 */
	static exitDragArea(event, callback) {
		if (!this.#rect || !this.#currentDrag?.area) return false;
		const departed =
			event.clientY <= this.#rect.top ||
			event.clientY >= this.#rect.bottom ||
			event.clientX <= this.#rect.left ||
			event.clientX >= this.#rect.right;
		if (!departed || callback(this.#currentDrag.area) === false) return false;
		return true;
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
		if (!foundry.utils.isEmpty(data)) return { area: this.#currentDrag.area, data };
		if (this.#currentDrag?.data)
			return {
				area: this.#currentDrag.area,
				data: this.#currentDrag.data,
				document: this.#currentDrag.document
			};
		return {};
	}
}
