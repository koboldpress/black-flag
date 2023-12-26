import { performCheck } from "../../utils/filter.mjs";
import BlackFlagDialog from "../dialog.mjs";
import AppAssociatedElement from "./app-associated-element.mjs";
import FiltersElement from "./filters.mjs";
import SortingElement from "./sorting.mjs";

export default class InventoryElement extends AppAssociatedElement {

	constructor() {
		super();
		this.#controller = new AbortController();
		this.#tab = this.getAttribute("tab");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	connectedCallback() {
		super.connectedCallback();

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this._onAction(event.currentTarget, event.currentTarget.dataset.action);
			}, { signal: this.#controller.signal });
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

	disconnectedCallback() {
		this.#controller.abort();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Controller for handling removal of event listeners.
	 * @type {AbortController}
	 */
	#controller;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document containing this inventory.
	 * @type {BlackFlagActor|BlackFlagItem}
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

	/**
	 * Cached data on constructed sections.
	 * @type {{[key: string]: SheetSectionConfiguration}}
	 */
	#sectionsCache;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Tab that this inventory represents.
	 * @type {string}
	 */
	#tab;

	get tab() {
		return this.#tab;
	}

	set tab(value) {
		this.#tab = value;
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
		const event = new CustomEvent("bf-inventory", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if ( target.dispatchEvent(event) === false ) return;

		const itemId = target.closest("[data-item-id]")?.dataset.itemId;
		const item = await this.getItem(itemId);
		if ( (action !== "add") && !item ) return;

		switch ( action ) {
			case "add":
				return this._onAddItem(target);
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

	/**
	 * Handle creating a new item within a certain section.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 */
	async _onAddItem(target) {
		// Fetch configuration information for this section
		const config = this.getSectionConfiguration(target.closest("[data-section]").dataset.section);
		const makeLabel = d => d.label ? game.i18n.localize(d.label) : game.i18n.localize(CONFIG.Item.typeLabels[d.type]);
		if ( !config.create ) return;

		// If more than one type is present, display a tooltip for selection which should be used
		let createData = config.create[0];
		if ( config.create.length > 1 ) {
			try {
				createData = await BlackFlagDialog.tooltipWait({ element: target }, {
					content: game.i18n.localize("BF.Item.Create.Prompt"),
					buttons: Object.fromEntries(config.create.map((t, i) => [i, {
						label: makeLabel(t),
						callback: html => t
					}])),
					render: true
				});
			} catch(err) {
				return;
			}
		}

		// Create an item with the first type
		const itemData = {
			name: game.i18n.format("BF.New.Specific", { type: makeLabel(createData) }),
			...createData
		};
		delete itemData.label;
		this.document.createEmbeddedDocuments("Item", [itemData]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve an item with the specified ID.
	 * @param {string} id
	 * @returns {BlackFlagItem|Promise<BlackFlagItem>}
	 */
	getItem(id) {
		if ( this.document.type === "container" ) return this.document.system.getContainedItem(id);
		return this.document.items.get(id);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Construct sheet sections based on data in `CONFIG.BlackFlag.sheetSections`.
	 * @param {BlackFlagActor|BlackFlagItem} document - Document for who the sections should be built.
	 * @param {string} [tab] - Only build sections for a specific tab.
	 * @returns {object}
	 * @internal
	 */
	static buildSections(document, tab) {
		const sections = {};

		for ( const config of CONFIG.BlackFlag.sheetSections[document.type] ?? [] ) {
			if ( tab && config.tab !== tab ) continue;
			const collection = tab ? sections : (sections[config.tab] ??= {});
			const toAdd = config.expand ? config.expand(document, config) : [config];
			toAdd.forEach(c => collection[c.id] = { ...c, items: [] });
		}

		return sections;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort provided items into sections defined by the document's type.
	 * @param {BlackFlagActor|BlackFlagItem} document - Document for who the sections should be created.
	 * @param {BlackFlagItem[]} items - Items to categorize.
	 * @param {object} [options={}]
	 * @param {async Function} [options.callback] - Method called for each item after it is added to a section.
	 * @param {boolean} [options.hide=true] - Should sections marked autoHide by hidden if empty?
	 * @returns {object} - Object with sections grouped by tabs and all their items.
	 */
	static async organizeItems(document, items, { callback, hide=true }={}) {
		const sections = this.buildSections(document);
		const uncategorized = [];

		for ( const item of items ) {
			const section = InventoryElement.organizeItem(item, sections);
			if ( section === false ) uncategorized.push(item);
			if ( callback ) await callback(item, section);
		}

		const filters = document.flags["black-flag"]?.sheet?.filters ?? {};
		const sorting = document.flags["black-flag"]?.sheet?.sorting ?? {};
		for ( const [tab, data] of Object.entries(sections) ) {
			for ( const [key, section] of Object.entries(data) ) {
				section.items = FiltersElement.filter(section.items, filters[tab]);
				section.items = SortingElement.sort(section.items, sorting[tab]);
				if ( hide && section.options?.autoHide && !section.items.length ) delete data[key];
			}
		}

		if ( uncategorized.length ) sections.uncategorized = uncategorized;

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
		for ( const tab of Object.values(sections) ) {
			for ( const section of Object.values(tab) ) {
				if ( performCheck(item, section.filters) ) {
					section.items.push(item);
					return section;
				}
			}
		}

		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch the configuration information for a specific section.
	 * @param {string} id - ID of the section to fetch.
	 * @returns {SheetSectionConfiguration}
	 */
	getSectionConfiguration(id) {
		if ( !this.#sectionsCache ) {
			const sections = this.constructor.buildSections(this.document, this.getAttribute("tab"));
			this.#sectionsCache = sections;
		}
		return this.#sectionsCache[id];
	}
}
