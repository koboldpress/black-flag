import BlackFlagContextMenu from "../context-menu.mjs";
import DocumentSheetAssociatedElement from "./document-sheet-associated-element.mjs";

/**
 * Custom element for displaying the actions on the actor sheets.
 */
export default class ActionsElement extends DocumentSheetAssociatedElement {
	connectedCallback() {
		super.connectedCallback();
		this.#controller = new AbortController();
		const { signal } = this.#controller;

		// Attach listeners to buttons
		for (const button of this.querySelectorAll("[data-action]")) {
			const handler = event => {
				event.stopImmediatePropagation();
				this._onAction(event.currentTarget, event.currentTarget.dataset.action, { event });
			};
			button.addEventListener("click", handler, { signal });
			button.addEventListener(
				"contextmenu",
				event => {
					if (event.ctrlKey) handler(event);
				},
				{ signal }
			);
		}

		new BlackFlagContextMenu(this, "[data-item-id]", [], { onOpen: this._onContextMenu.bind(this) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	disconnectedCallback() {
		this.#controller.abort();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor that originates these actions.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Controller for handling removal of event listeners.
	 * @type {AbortController}
	 */
	#controller;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied to action entries.
	 * @param {BlackFlagItem} item - The item for which the context menu is being activated.
	 * @param {Activity} [activity] - Activity for which the context menu is being activated.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 * @protected
	 */
	_getContextMenuOptions(item, activity) {
		return [
			{
				name: "BF.ACTIVITY.Core.Action.View",
				icon: "<i class='fa-solid fa-eye fa-fw'></i>",
				condition: li => activity && !this.isEditable,
				callback: li => this._onAction(li[0], "view"),
				group: "activity"
			},
			{
				name: "BF.ACTIVITY.Core.Action.Activate",
				icon: '<i class="fa-solid fa-power-off fa-fw" inert></i>',
				condition: li => activity && this.isEditable,
				callback: li => this._onAction(li[0], "activate"),
				group: "activity"
			},
			{
				name: "BF.ACTIVITY.Core.Action.Edit",
				icon: '<i class="fa-solid fa-edit fa-fw" inert></i>',
				condition: li => activity && this.isEditable,
				callback: li => this._onAction(li[0], "edit"),
				group: "activity"
			},
			{
				name: "BF.ACTIVITY.Core.Action.Delete",
				icon: '<i class="fa-solid fa-trash fa-fw destructive" inert></i>',
				condition: li => activity && this.isEditable,
				callback: li => this._onAction(li[0], "delete"),
				group: "activity"
			},
			{
				name: "BF.Item.Action.Post",
				icon: '<i class="fa-solid fa-envelope fa-fw" inert></i>',
				callback: li => this._onAction(li[0], "post"),
				group: "item"
			},
			{
				name: "BF.Item.Action.View",
				icon: "<i class='fa-solid fa-eye fa-fw'></i>",
				condition: li => !this.isEditable,
				callback: li => this._onAction(li[0], "viewItem"),
				group: "item"
			},
			{
				name: "BF.Item.Action.Edit",
				icon: '<i class="fa-solid fa-edit fa-fw" inert></i>',
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "editItem"),
				group: "item"
			},
			{
				name: "BF.Item.Action.Delete",
				icon: '<i class="fa-solid fa-trash fa-fw destructive" inert></i>',
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "deleteItem"),
				group: "item"
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking an action.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @param {object} [options={}]
	 * @param {Event} [options.event] - Triggering event.
	 * @returns {Promise}
	 */
	async _onAction(target, action, { event } = {}) {
		const actionEvent = new CustomEvent("bf-actions", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if (target.dispatchEvent(actionEvent) === false) return;

		const dataset = (
			target.closest("[data-activity], [data-activity-id], [data-activity-uuid], [data-item-id]") || target
		).dataset;
		let activity;
		const item = this.actor.items.get(dataset.itemId);
		if (dataset.activityUuid || dataset.activity) activity = await fromUuid(dataset.activityUuid ?? dataset.activity);
		else activity = item?.system.activities?.get(dataset.activityId);

		switch (action) {
			case "activate":
				if (activity) return activity.activate({ event });
			case "activateItem":
				return item?.activate({ event });
			case "delete":
				if (activity) return activity.deleteDialog();
			case "deleteItem":
				if (item) return item.deleteDialog();
				break;
			case "edit":
			case "view":
				if (activity) return activity.sheet.render({ force: true });
			case "editItem":
			case "viewItem":
				if (item) return item.sheet.render(true);
				break;
			case "post":
				if (item) return item.postToChat();
				break;
		}

		return this.app._onAction?.(event ?? actionEvent, dataset);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle opening the context menu.
	 * @param {HTMLElement} element - The element the context menu was triggered on.
	 * @protected
	 */
	_onContextMenu(element) {
		const dataset = element.closest("[data-item-id]")?.dataset ?? {};
		const item = this.actor.items.get(dataset?.itemId);
		if (!item) {
			ui.context.menuItems = [];
			return;
		}
		const activity = item?.system.activities?.get(dataset.activityId);

		ui.context.menuItems = this._getContextMenuOptions(item, activity);
		/**
		 * A hook event that fires when the context menu for an actions list is constructed.
		 * @function blackFlag.getActionsContext
		 * @memberof hookEvents
		 * @param {ActionsElement} html - The HTML element to which the context options are attached.
		 * @param {BlackFlagItem} item - The item for which the context options are being prepared.
		 * @param {Activity} [activity] - The activity for which the context options are being prepared.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getActionsContext", this, item, activity, ui.context.menuItems);
	}
}
