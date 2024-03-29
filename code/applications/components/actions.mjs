import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying the actions on the actor sheets.
 */
export default class ActionsElement extends AppAssociatedElement {
	constructor() {
		super();
		this.#controller = new AbortController();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();
		const { signal } = this.#controller;

		// Attach listeners to buttons
		for ( const button of this.querySelectorAll("[data-action]") ) {
			button.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this._onAction(event.currentTarget, event.currentTarget.dataset.action);
			}, { signal });
		}

		new ContextMenu(this, "[data-item-id]", [], { onOpen: this._onContextMenu.bind(this) });
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
		return this.app.document;
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
				name: "BF.Activity.Core.Action.Activate",
				icon: "<i class='fa-solid fa-power-off fa-fw' inert></i>",
				condition: li => activity && item.isOwner,
				callback: li => this._onAction(li[0], "activate")
			},
			{
				name: "BF.Activity.Core.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw' inert></i>",
				condition: li => activity && item.isOwner,
				callback: li => this._onAction(li[0], "edit")
			},
			{
				name: "BF.Item.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw' inert></i>",
				condition: li => item.isOwner,
				callback: li => this._onAction(li[0], "editItem")
			},
			{
				name: "BF.Activity.Core.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw' inert></i>",
				condition: li => activity && item.isOwner,
				callback: li => this._onAction(li[0], "delete"),
				group: "destructive"
			},
			{
				name: "BF.Item.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw' inert></i>",
				condition: li => item.isOwner,
				callback: li => this._onAction(li[0], "deleteItem"),
				group: "destructive"
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking an action.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise}
	 */
	async _onAction(target, action) {
		const event = new CustomEvent("bf-actions", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if ( target.dispatchEvent(event) === false ) return;

		const dataset = target.closest("[data-activity], [data-activity-id], [data-item-id]")?.dataset ?? {};
		let activity;
		const item = this.actor.items.get(dataset.itemId);
		if ( dataset.activity ) activity = await fromUuid(dataset.activity);
		else activity = item?.system.activities?.get(dataset.activityId);

		switch ( action ) {
			case "activate":
				if ( activity ) return activity.activate();
				break;
			case "delete":
				if ( activity ) return activity.deleteDialog();
				break;
			case "deleteItem":
				if ( item ) return item.deleteDialog();
				break;
			case "edit":
				if ( activity ) return activity.sheet.render(true);
				break;
			case "editItem":
				if ( item ) return item.sheet.render(true);
				break;
		}

		return this.app._onAction?.(event, dataset);
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
		if ( !item ) {
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
