import ActivitySelection from "../activity/activity-selection.mjs";
import BlackFlagContextMenu from "../context-menu.mjs";
import DragDrop from "../drag-drop.mjs";
import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying the activities on an item sheet.
 */
export default class ActivitiesElement extends AppAssociatedElement {
	constructor() {
		super();
		this.#controller = new AbortController();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();
		const { signal } = this.#controller;

		this.addEventListener("dragenter", this._onDragEnter.bind(this), { signal });
		this.addEventListener("dragover", this._onDragOver.bind(this), { signal });
		this.addEventListener("dragleave", this._onDragLeave.bind(this), { signal });
		this.addEventListener("drop", this._onDrop.bind(this), { signal });

		for (const element of this.querySelectorAll("[data-activity-id]")) {
			element.setAttribute("draggable", true);
			element.ondragstart = this._onDragStart.bind(this);
			element.ondragend = this._onDragEnd.bind(this);
		}

		for (const element of this.querySelectorAll("[data-action]")) {
			element.addEventListener(
				"click",
				event => {
					event.stopImmediatePropagation();
					this._onAction(event.currentTarget, event.currentTarget.dataset.action);
				},
				{ signal }
			);
		}

		new BlackFlagContextMenu(this, "[data-activity-id]", [], { onOpen: this._onContextMenu.bind(this) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	disconnectedCallback() {
		this.#controller.abort();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Activities collection stored on the item.
	 * @type {ActivityCollection}
	 */
	get activities() {
		return this.item.system.activities;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Controller for handling removal of event listeners.
	 * @type {AbortController}
	 */
	#controller;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does the user have permission to edit the item?
	 * @type {boolean}
	 */
	get isEditable() {
		return this.item.testUserPermission(game.user, "EDIT");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item represented by the app.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.app.document;
	}

	/**
	 * Stored copy of client rect during drag events.
	 * @type {DOMRect}
	 */
	#rect;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied for activity entries.
	 * @param {Activity} activity - The activity for which the context menu is being activated.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 */
	_getContextMenuOptions(activity) {
		return [
			{
				name: "BF.Activity.Core.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw'></i>",
				condition: li => activity && this.isEditable,
				callback: li => this._onAction(li[0], "edit")
			},
			{
				name: "BF.Activity.Core.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw'></i>",
				condition: li => activity && this.isEditable,
				callback: li => this._onAction(li[0], "duplicate")
			},
			{
				name: "BF.Activity.Core.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw'></i>",
				condition: li => activity && this.isEditable,
				callback: li => this._onAction(li[0], "delete"),
				group: "destructive"
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle one of the actions from the buttons or context menu.
	 * @param {Element} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise|void}
	 */
	_onAction(target, action) {
		const id = target.closest("[data-activity-id]")?.dataset.activityId;
		const activity = this.activities.get(id);
		if (["edit", "delete", "duplicate"].includes(action) && !activity) return;
		switch (action) {
			case "add":
				return ActivitySelection.createDialog(this.item);
			case "edit":
			case "view":
				return activity.sheet.render(true);
			case "delete":
				return activity.deleteDialog();
			case "duplicate":
				const data = activity.toObject();
				delete data._id;
				return this.item.createEmbeddedDocuments("Activity", [data]);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle opening the context menu.
	 * @param {HTMLElement} element - The element the context menu was triggered on.
	 * @protected
	 */
	_onContextMenu(element) {
		const activity = this.activities.get(element.closest("[data-activity-id]")?.dataset.activityId);
		ui.context.menuItems = this._getContextMenuOptions(activity);
		/**
		 * A hook event that fires when the context menu for an activities list is constructed.
		 * @function blackFlag.getItemActivityContext
		 * @memberof hookEvents
		 * @param {InventoryElement} html - The HTML element to which the context options are attached.
		 * @param {Activity} activity - The activity for which the context options are being prepared.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getItemActivityContext", this, activity, ui.context.menuItems);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Drag & Drop            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Begin dragging an entry.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	_onDragStart(event) {
		const activityId = event.currentTarget.dataset.activityId;
		const activity = this.activities.get(activityId);
		DragDrop.beginDragEvent(event, activity);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Stop dragging an entry.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	_onDragEnd(event) {
		delete this.dataset.dropStatus;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry drags into the element.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	_onDragEnter(event) {
		const { data } = DragDrop.getDragData(event);
		if (!data) this.dataset.dropStatus = "unknown";
		else this.dataset.dropStatus = this._validateDrop(data) ? "valid" : "invalid";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry drags over the element.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	_onDragOver(event) {
		event.preventDefault();
		this.#rect = this.getBoundingClientRect();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry being dragged over leaves the element.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	_onDragLeave(event) {
		if (
			event.clientY <= this.#rect.top ||
			event.clientY >= this.#rect.bottom ||
			event.clientX <= this.#rect.left ||
			event.clientX >= this.#rect.right
		) {
			delete this.dataset.dropStatus;
			this.#rect = null;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry is dropped onto the element.
	 * @param {DragEvent} event - Triggering drop event.
	 * @returns {Promise}
	 */
	async _onDrop(event) {
		const { data } = DragDrop.getDragData(event);
		if (!this._validateDrop(data)) return false;

		try {
			const activity = (await fromUuid(data.uuid)).toObject() ?? activity.data;
			if (!activity) return false;

			delete activity._id;
			this.item.createEmbeddedDocuments("Activity", [activity]);
		} finally {
			DragDrop.finishDragEvent(event);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can the dragged document be dropped?
	 * @param {object} data
	 * @returns {boolean}
	 */
	_validateDrop(data) {
		if (data.type !== "Activity") return false;
		if (!data.uuid) return true;
		return !data.uuid.startsWith(this.item.uuid);
	}
}
