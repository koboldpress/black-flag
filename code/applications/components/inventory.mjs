import AppAssociatedElement from "./app-associated-element.mjs";

export default class InventoryElement extends AppAssociatedElement {

	connectedCallback() {
		super.connectedCallback();

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this._onAction(event.currentTarget, event.currentTarget.dataset.action);
			});
		}

		const contextOptions = this._getContextMenuOptions();
		/**
		 * A hook event that fires when the context menu for an inventory list is constructed.
		 * @function blackFlag.getInventoryContext
		 * @memberof hookEvents
		 * @param {InventoryElement} html - The HTML element to which the context options are attached.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getInventoryContext", this, contextOptions);
		if ( contextOptions ) ContextMenu.create(this.app, this, "[data-item-id]", contextOptions);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document containing this inventory.
	 * @type {BlackFlagActor}
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
		return this.document.testUserPermission(game.user, "EDIT");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied to inventory entries.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 */
	_getContextMenuOptions() {
		return [
			{
				name: "BF.Item.Action.View",
				icon: "<i class='fa-solid fa-eye fa-fw'></i>",
				condition: li => !this.isEditable,
				callback: li => this._onAction(li[0], "view")
			},
			{
				name: "BF.Item.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "edit")
			},
			{
				name: "BF.Item.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "duplicate")
			},
			{
				name: "BF.Item.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "delete"),
				group: "destructive"
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle one of the actions from the buttons or context menu.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise}
	 */
	async _onAction(target, action) {
		const event = new CustomEvent("inventory", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if ( target.dispatchEvent(event) === false ) return;

		const itemId = target.closest("[data-item-id]")?.dataset.itemId;
		const item = await this.document.items.get(itemId);
		if ( (action !== "add") && !item ) return;

		switch ( action ) {
			case "add":
				return console.log("ADD");
			case "delete":
				return item.deleteDialog();
			case "duplicate":
				return item.clone({ name: game.i18n.format("DOCUMENT.CopyOf", {name: item.name}) }, { save: true });
			case "edit":
			case "view":
				return item.sheet.render(true);
		}
	}
}
