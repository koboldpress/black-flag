import BlackFlagItem from "../../documents/item.mjs";
import { performCheck } from "../../utils/filter.mjs";
import BlackFlagDialog from "../dialog.mjs";
import DragDrop from "../drag-drop.mjs";
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
		const { signal } = this.#controller;

		this.addEventListener("drop", this._onDrop.bind(this), { signal });

		for ( const element of this.querySelectorAll("[data-item-id]") ) {
			element.setAttribute("draggable", true);
			element.addEventListener("dragstart", this._onDragStart.bind(this));
		}

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this._onAction(event.currentTarget, event.currentTarget.dataset.action);
			}, { signal });
		}

		for ( const input of this.querySelectorAll('input[type="number"]') ) {
			input.addEventListener("change", this._onChangeInput.bind(this));
		}

		for ( const input of this.querySelectorAll('input[inputmode="numeric"]') ) {
			input.addEventListener("change", this._onChangeInputDelta.bind(this));
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
	 * Containing actor for this inventory, either the document or its parent if document is an item.
	 * @type {BlackFlagActor|null}
	 */
	get actor() {
		if ( this.document instanceof Actor ) return this.document;
		return this.document.actor ?? null;
	}

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
	 * @protected
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
	 * @protected
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
			case "adjustment":
				return this._onAdjustment(item, target);
			case "attune":
				return item.setFlag("black-flag", "relationship.attuned", !item.system.attuned);
			case "delete":
				return item.deleteDialog();
			case "duplicate":
				return item.clone({ name: game.i18n.format("DOCUMENT.CopyOf", {name: item.name}) }, { save: true });
			case "edit":
			case "view":
				return item.sheet.render(true);
			case "enable":
				return item.setFlag("black-flag", "relationship.enabled", !item.enabled);
			case "equip":
				return item.setFlag("black-flag", "relationship.equipped", !item.system.equipped);
			case "prepare":
				return item.setFlag("black-flag", "relationship.prepared", !item.system.prepared);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle creating a new item within a certain section.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 * @protected
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

	/**
	 * Handle clicking one of the adjustment buttons.
	 * @param {BlackFlagItem} item - Item that needs its data adjusted.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 * @protected
	 */
	async _onAdjustment(item, target) {
		const { direction, property } = target.dataset;
		const current = foundry.utils.getProperty(item, property) ?? 0;
		item.update({ [property]: current + (direction === "increase" ? 1 : -1) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle changing an input field directly in the inventory.
	 * @param {Event} event - Triggering change event.
	 * @returns {Promise}
	 * @protected
	 */
	async _onChangeInput(event) {
		const itemId = event.target.closest("[data-item-id]")?.dataset.itemId;
		const item = await this.getItem(itemId);
		if ( !item ) return;

		event.stopImmediatePropagation();
		const { property } = event.target.dataset;
		const min = event.target.min !== "" ? Number(event.target.min) : -Infinity;
		const max = event.target.max !== "" ? Number(event.target.max) : Infinity;
		const value = Math.clamped(event.target.valueAsNumber, min, max);
		if ( Number.isNaN(value) ) return;

		event.target.value = value;
		item.update({ [property]: value });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle input changes to numeric form fields, allowing them to accept delta-typed inputs.
	 * @param {Event} event - Triggering change event.
	 * @protected
	 */
	async _onChangeInputDelta(event) {
		const itemId = event.target.closest("[data-item-id]")?.dataset.itemId;
		const item = await this.getItem(itemId);
		if ( !item ) return;

		event.stopImmediatePropagation();
		const { property } = event.target.dataset;
		let value = event.target.value.trim();
		if ( ["+", "-"].includes(value[0]) ) {
			const delta = parseFloat(value);
			value = Number(foundry.utils.getProperty(item, property)) + delta;
		} else if ( value[0] === "=" ) {
			value = Number(value.slice(1));
		}
		const min = event.target.min !== "" ? Number(event.target.min) : -Infinity;
		const max = event.target.max !== "" ? Number(event.target.max) : Infinity;
		value = Math.clamped(value, min, max);
		if ( Number.isNaN(value) ) return;

		event.target.value = value;
		item.update({ [property]: value });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Drag & Drop            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Begin dragging an entry.
	 * @param {DragEvent} event - Triggering drag event.
	 * @protected
	 */
	async _onDragStart(event) {
		const itemId = event.currentTarget.dataset.itemId;
		const item = await this.getItem(itemId);
		if ( item ) DragDrop.beginDragEvent(event, item);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry is dropped onto the element.
	 * @param {DragEvent} event - Triggering drop event.
	 * @returns {Promise}
	 * @protected
	 */
	async _onDrop(event) {
		event.preventDefault();
		event.stopImmediatePropagation();

		if ( !this.isEditable ) return false;

		const { data } = DragDrop.getDragData(event);
		if ( !this._validateDrop(data) ) return false;
		// TODO: Add support for dropping folders

		try {
			const item = await Item.implementation.fromDropData(data);
			if ( !item ) return false;
			return this.constructor.dropItems(event, this.document, [item]);
		} finally {
			DragDrop.finishDragEvent(event);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can the dragged document be dropped?
	 * @param {object} data
	 * @returns {boolean}
	 * @protected
	 */
	_validateDrop(data) {
		if ( (data.type !== "Item") ) return false;
		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle an item dropped onto the sheet.
	 * @param {DragEvent} event - Triggering drop event.
	 * @param {BlackFlagActor|BlackFlagItem} target - Document to which the items were dropped.
	 * @param {BlackFlagItem|BlackFlagItem[]} itemData - One or more items dropped.
	 * @returns {Promise}
	 */
	static async dropItems(event, target, itemData) {
		const isContainer = target.type === "container";
		const actor = isContainer ? target.parent : target;

		if ( actor?.sheet._handleDroppedItems ) itemData = await actor.sheet._handleDroppedItems(event, itemData);
		if ( !itemData?.length ) return;

		const item = itemData[0];
		// TODO: Add support for multiple items

		if ( isContainer ) {
			const parentContainers = await target.system.allContainers();
			if ( (target.uuid === item.uuid) || parentContainers.includes(item) ) {
				ui.notifications.error("BF.Container.Warning.Recursive", { localize: true });
				return;
			}
		}

		// Document already exists in this collection, just perform sorting
		// TODO: Support using modifier key to change to copy rather than move operation in certain contexts
		if ( (actor?.uuid === item.parent?.uuid) && (target.pack === item.pack) ) {
			// If this inventory is on an actor, clear the container if set
			if ( !isContainer && (item.system.container !== null) ) {
				await item.update({"system.container": null});
			}

			// If this inventory is on an container, set it to this
			else if ( isContainer && (item.system.container !== target.id) ) {
				await item.update({"system.container": target.id});
			}

			// Then perform a sort
			return this._sortItems(event, target, [item]);
		}

		// TODO: Ensure created items can be created in this context
		// TODO: Perform consumable stacking

		// Create an item
		const options = { transformFirst: item => this._transformDroppedItem(event, target, item) };
		if ( isContainer ) options.container = target;
		const toCreate = await BlackFlagItem.createWithContents([item], options);
		if ( isContainer && target.folder ) toCreate.forEach(d => d.folder = target.folder);
		return BlackFlagItem.createDocuments(toCreate, {pack: target.pack, parent: actor, keepId: true});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort a dropped item based on where it was dropped.
	 * @param {DragEvent} event - Triggering drag event.
	 * @param {BlackFlagActor|BlackFlagItem} target - Document to which the items were dropped.
	 * @param {BlackFlagItem|object} itemData - Data for the item being dropped.
	 * @returns {Promise}
	 * @protected
	 */
	static async _sortItems(event, target, itemData) {
		const dropTarget = event.target.closest("[data-item-id]");
		if ( !dropTarget ) return;
		const item = itemData[0];
		// TODO: Add support for multiple items

		const getItem = async id => {
			if ( target instanceof Actor ) return target.items.get(id);
			else return (await target.system.contents).get(id);
		};

		const sortTarget = await getItem(dropTarget.dataset.itemId);

		// Don't sort on yourself
		if ( item.id === sortTarget.id ) return;

		// Identify sibling items based on adjacent HTML elements
		const siblings = [];
		for ( const el of dropTarget.parentElement.children ) {
			const siblingId = el.dataset.itemId;
			if ( siblingId && (siblingId !== item.id) ) siblings.push(await getItem(siblingId));
		}

		// Perform the sort
		const sortUpdates = SortingHelpers.performIntegerSort(item, {target: sortTarget, siblings});
		const updateData = sortUpdates.map(u => {
			const update = u.update;
			update._id = u.target.id;
			return update;
		});

		// Perform the update
		// TODO: Test what happens if you only have permission to some of these objects, perhaps no sorting in sidebar?
		Item.updateDocuments(updateData, {pack: target.pack, parent: target.type === "container" ? target.actor : target});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle any extra parsing or cleanup actions for items dropped on the sheet.
	 * @param {DragEvent} event - Triggering drop event.
	 * @param {BlackFlagActor|BlackFlagItem} target - Document to which the items were dropped.
	 * @param {BlackFlagItem|object} itemData - Data for the item being dropped.
	 * @returns {Promise<object|false>} - Parsed data or `false` to prevent this item from being created.
	 * @protected
	 */
	static async _transformDroppedItem(event, target, itemData) {
		if ( itemData instanceof Item ) itemData = itemData.toObject();

		const findItem = async query => {
			if ( target instanceof Actor ) return target.items.find(query);
			else return (await target.system.contents).find(query);
		};

		// TODO: Ensure no items not allowed on this actor type are dropped

		// TODO: Convert spells to spell scrolls if dropped on the inventory tab

		// TODO: Determine proper spell mode for spells dropped directly into spellcasting section

		// TODO: Stack identical consumables

		// Stack identical currencies
		if ( itemData.type === "currency" ) {
			const existingItem = await findItem(i =>
				(i.type === "currency") && (i.identifier === itemData.system.identifier.value)
			);
			if ( existingItem ) {
				await existingItem.update({
					"system.quantity": existingItem.system.quantity + Math.max(1, itemData.system.quantity)
				});
				return false;
			}
		}

		return itemData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Find an item inside the inventory.
	 * @param {Function} query
	 * @returns {BlackFlagItem|Promise<BlackFlagItem>}
	 */
	findItem(query) {
		if ( this.document.type === "container" ) {
			const contents = this.document.system.contents;
			if ( contents instanceof Promise ) return contents.then(c => c.find(query));
			else return contents.find(query);
		}
		return this.document.items.find(query);
	}

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

		if ( document instanceof Actor ) items = items.filter(i => !document.items.has(i.system.container));

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
				section.items = SortingElement.sort(section.items, section.options?.sorting ?? sorting[tab]);
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
