export default class BlackFlagDragDrop extends foundry.applications.ux.DragDrop {
	/**
	 * Data about the ongoing drag event.
	 * @type {{event: DragEvent, data: *, [document]: Document, [rect]: DOMRect}|null}
	 */
	static #currentDrag;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Tracking rect for the current drag area.
	 * @type {DOMRect}
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
	 * @returns {DragEventData}
	 */
	static getDragData(event) {
		const data = (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).getDragEventData(event);
		if (!foundry.utils.isEmpty(data)) return { area: this.#currentDrag?.area, data };
		if (this.#currentDrag?.data) return { ...this.#currentDrag };
		return {};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the data payload for the current drag event.
	 * @param {DragEvent} event
	 * @returns {any}
	 */
	static getPayload(event) {
		if (!BlackFlagDragDrop.#currentDrag?.data) return null;
		return BlackFlagDragDrop.#currentDrag.data;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _handleDragStart(event) {
		await this.callback(event, "dragstart");
		if (event.dataTransfer.items.length) {
			event.stopPropagation();
			let data = event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");
			try {
				data = JSON.parse(data);
			} catch (err) {}
			BlackFlagDragDrop.#currentDrag = data ? { event, data } : null;
		} else {
			BlackFlagDragDrop.#currentDrag = null;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _handleDragEnd(event) {
		await this.callback(event, "dragend");
		BlackFlagDragDrop.finishDragEvent(event);
	}
}
