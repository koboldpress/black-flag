import ActivitySelection from "../activity/activity-selection.mjs";
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

		this.addEventListener("dragenter", this.#onDragEnter.bind(this), { signal });
		this.addEventListener("dragover", this.#onDragOver.bind(this), { signal });
		this.addEventListener("dragleave", this.#onDragLeave.bind(this), { signal });
		this.addEventListener("drop", this.#onDrop.bind(this), { signal });

		for ( const element of this.querySelectorAll("[data-activity-id]") ) {
			element.setAttribute("draggable", true);
			element.ondragstart = this.#onDragStart.bind(this);
			element.ondragend = this.#onDragEnd.bind(this);
		}

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this.#onAction(event.currentTarget, event.currentTarget.dataset.action);
			}, { signal });
		}

		const contextOptions = this.#getContextMenuOptions();
		/**
		 * A hook event that fires when the context menu for the activities list is constructed.
		 * @function blackFlag.getItemActivityContext
		 * @memberof hookEvents
		 * @param {ActivitiesElement} html - The HTML element to which the context options are attached.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getItemActivityContext", this, contextOptions);
		if ( contextOptions ) ContextMenu.create(this.app, this, "[data-activity-id]", contextOptions);
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
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 */
	#getContextMenuOptions() {
		return [
			{
				name: "BF.Activity.Core.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this.#onAction(li[0], "edit")
			},
			{
				name: "BF.Activity.Core.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this.#onAction(li[0], "duplicate")
			},
			{
				name: "BF.Activity.Core.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this.#onAction(li[0], "delete"),
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
	#onAction(target, action) {
		const id = target.closest("[data-activity-id]")?.dataset.activityId;
		const activity = this.activities.get(id);
		if ( ["edit", "delete", "duplicate"].includes(action) && !activity ) return;
		switch ( action ) {
			case "add": return ActivitySelection.createDialog(this.item);
			case "edit":
			case "view": return activity.sheet.render(true);
			case "delete": return activity.deleteDialog();
			case "duplicate":
				const data = activity.toObject();
				delete data._id;
				return this.item.createEmbeddedDocuments("Activity", [data]);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Drag & Drop            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Begin dragging an entry.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	#onDragStart(event) {
		const activityId = event.currentTarget.dataset.activityId;
		const activity = this.activities.get(activityId);
		event.dataTransfer.setData("text/plain", JSON.stringify(activity.toDragData()));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Stop dragging an entry.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	#onDragEnd(event) {
		delete this.dataset.dropStatus;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry drags into the element.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	#onDragEnter(event) {
		const data = TextEditor.getDragEventData(event);
		if ( !data ) this.dataset.dropStatus = "unknown";
		else this.dataset.dropStatus = this.#validateDrop(data) ? "valid" : "invalid";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry drags over the element.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	#onDragOver(event) {
		event.preventDefault();
		this.#rect = this.getBoundingClientRect();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry being dragged over leaves the element.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	#onDragLeave(event) {
		if ( event.clientY <= this.#rect.top || event.clientY >= this.#rect.bottom
			|| event.clientX <= this.#rect.left || event.clientX >= this.#rect.right ) {
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
	async #onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		if ( !this.#validateDrop(data) ) return false;

		const activity = (await fromUuid(data.uuid)).toObject() ?? activity.data;
		if ( !activity ) return false;

		delete activity._id;
		this.item.createEmbeddedDocuments("Activity", [activity]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can the dragged document be dropped?
	 * @param {object} data
	 * @returns {boolean}
	 */
	#validateDrop(data) {
		if ( (data.type !== "Activity") ) return false;
		if ( !data.uuid ) return true;
		return !data.uuid.startsWith(this.item.uuid);
	}
}
