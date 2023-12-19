import AppAssociatedElement from "./app-associated-element.mjs";
import FiltersElement from "./filters.mjs";

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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Construct sheet sections based on data in `CONFIG.BlackFlag.sheetSections`.
	 * @param {BlackFlagActor} actor - Actor for who the sections should be built.
	 * @returns {object}
	 * @internal
	 */
	static buildSections(actor) {
		const sections = {};

		for ( const config of CONFIG.BlackFlag.sheetSections[actor.type] ?? [] ) {
			const tab = sections[config.tab] ??= {};
			const toAdd = config.expand ? config.expand(actor, config) : [config];
			toAdd.forEach(c => tab[c.id] = { ...c, items: [] });
		}

		sections.uncategorized = [];

		return sections;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort provided items into sections defined by the actor's type.
	 * @param {BlackFlagActor} actor - Actor for who the sections should be created.
	 * @param {BlackFlagItem[]} items - Items to categorize.
	 * @param {object} [options={}]
	 * @param {async Function} [options.callback] - Method called for each item after it is added to a section.
	 * @param {{[key: string]: {[key: string]: number}}} [options.filters] - Any filtering to apply.
	 * @param {boolean} [options.hide=true] - Should sections marked autoHide by hidden if empty?
	 * @returns {object} - Object with sections grouped by tabs and all their items.
	 */
	static async organizeItems(actor, items, { callback, filters={}, hide=true }={}) {
		const sections = this.buildSections(actor);

		for ( const item of Array.from(items).sort((a, b) => a.sort - b.sort) ) {
			const section = InventoryElement.organizeItem(item, sections);
			if ( section === false ) sections.uncategorized.push(item);
			if ( callback ) await callback(item, section);
		}

		for ( const [tab, data] of Object.entries(sections) ) {
			for ( const [key, section] of Object.entries(data) ) {
				section.items = FiltersElement.filterItems(section.items, filters[tab]);
				if ( hide && section.options?.autoHide && !section.items.length ) delete data[key];
			}
		}

		return sections;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Place an item in the appropriate section.
	 * @param {BlackFlagItem} item - Item to organize.
	 * @param {object} sections - Sections to populate.
	 * @returns {object|false} - Section into which the item was inserted, or false if no section match was found.
	 * @internal
	 */
	static organizeItem(item, sections) {
		const checkFilter = (item, filter) => Object.entries(filter)
			.every(([key, value]) => foundry.utils.getProperty(item, key) === value);

		for ( const tab of Object.values(sections) ) {
			for ( const section of Object.values(tab) ) {
				for ( const type of section.types ?? [] ) {
					if ( checkFilter(item, type) ) {
						section.items.push(item);
						return section;
					}
				}
			}
		}

		return false;
	}
}
