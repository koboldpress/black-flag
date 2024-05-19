import { log } from "../../utils/_module.mjs";
import AdvancementSelection from "../advancement/advancement-selection.mjs";
import BlackFlagContextMenu from "../context-menu.mjs";
import DragDrop from "../drag-drop.mjs";
import DocumentSheetAssociatedElement from "./document-sheet-associated-element.mjs";

/**
 * Custom element for displaying the advancement on an item sheet.
 */
export default class AdvancementElement extends DocumentSheetAssociatedElement {
	constructor() {
		super();
		this.#controller = new AbortController();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	connectedCallback() {
		super.connectedCallback();
		const { signal } = this.#controller;

		this.addEventListener("drop", this._onDrop.bind(this), { signal });

		for (const element of this.querySelectorAll("[data-advancement-id]")) {
			element.setAttribute("draggable", true);
			element.ondragstart = this._onDragStart.bind(this);
		}

		for (const element of this.querySelectorAll("[data-action]")) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this._onAction(event.currentTarget, event.currentTarget.dataset.action);
			});
		}

		new BlackFlagContextMenu(this, "[data-advancement-id]", [], { onOpen: this._onContextMenu.bind(this) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	disconnectedCallback() {
		this.#controller.abort();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Advancement collection stored on the item.
	 * @type {AdvancementCollection}
	 */
	get advancement() {
		return this.item.system.advancement;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Controller for handling removal of event listeners.
	 * @type {AbortController}
	 */
	#controller;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item represented by the app.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the provided advancement collection for display.
	 * @param {AdvancementCollection} advancement
	 * @returns {object}
	 */
	static prepareContext(advancement) {
		const context = {};

		const needingConfiguration = advancement.filter(a => !a.levels.length);
		if (needingConfiguration.length) {
			context.unconfigured = {
				items: needingConfiguration.map(a => ({
					id: a.id,
					order: a.constructor.order,
					title: a.title,
					icon: a.icon,
					classRestriction: a.level.classRestriction
				}))
			};
		}

		for (const level of advancement.levels) {
			const levels = { character: level, class: level };
			const items = advancement.byLevel(level).map(a => ({
				id: a.id,
				order: a.sortingValueForLevel(levels),
				title: a.titleForLevel(levels),
				icon: a.icon,
				classRestriction: a.level.classRestriction,
				summary: a.summaryForLevel(levels)
			}));
			if (!items.length) continue;
			context[level] = { items: items.sort((a, b) => a.order.localeCompare(b.order)) };
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied for advancement entries.
	 * @param {Advancement} advancement - The advancement for which the context menu is being activated.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 */
	_getContextMenuOptions(advancement) {
		return [
			{
				name: "BF.Advancement.Core.Action.View",
				icon: "<i class='fa-solid fa-eye fa-fw'></i>",
				condition: li => advancement && !this.isEditable,
				callback: li => this._onAction(li[0], "view")
			},
			{
				name: "BF.Advancement.Core.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw'></i>",
				condition: li => advancement && this.isEditable,
				callback: li => this._onAction(li[0], "edit")
			},
			{
				name: "BF.Advancement.Core.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw'></i>",
				condition: li => this.isEditable && advancement?.constructor.availableForItem(this.item),
				callback: li => this._onAction(li[0], "duplicate")
			},
			{
				name: "BF.Advancement.Core.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw'></i>",
				condition: li => advancement && this.isEditable,
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
		const id = target.closest("[data-advancement-id]")?.dataset.advancementId;
		const advancement = this.advancement.get(id);
		if (["edit", "delete", "duplicate"].includes(action) && !advancement) return;
		switch (action) {
			case "add":
				return AdvancementSelection.createDialog(this.item);
			case "edit":
			case "view":
				return advancement.sheet.render(true);
			case "delete":
				return advancement.deleteDialog();
			case "duplicate":
				const data = advancement.toObject();
				delete data._id;
				return this.item.createEmbeddedDocuments("Advancement", [data]);
			default:
				return log(`Invalid advancement action type clicked ${action}.`, { level: "warn" });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle opening the context menu.
	 * @param {HTMLElement} element - The element the context menu was triggered on.
	 * @protected
	 */
	_onContextMenu(element) {
		const advancement = this.advancement.get(element.closest("[data-advancement-id]")?.dataset.advancementId);
		ui.context.menuItems = this._getContextMenuOptions(advancement);
		/**
		 * A hook event that fires when the context menu for an activities list is constructed.
		 * @function blackFlag.getItemAdvancementContext
		 * @memberof hookEvents
		 * @param {InventoryElement} html - The HTML element to which the context options are attached.
		 * @param {Advancement} advancement - The advancement for which the context options are being prepared.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getItemAdvancementContext", this, advancement, ui.context.menuItems);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Drag & Drop            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Begin dragging an entry.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	_onDragStart(event) {
		const advancementId = event.currentTarget.dataset.advancementId;
		const advancement = this.advancement.get(advancementId);
		DragDrop.beginDragEvent(event, advancement);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An entry is dropped onto the element.
	 * @param {DragEvent} event - Triggering drop event.
	 * @returns {Promise}
	 */
	async _onDrop(event) {
		event.preventDefault();
		event.stopImmediatePropagation();

		if (!this.isEditable) return false;

		const { data } = DragDrop.getDragData(event);
		if (!this._validateDrop(data)) return false;

		try {
			const advancement = (await fromUuid(data.uuid)).toObject() ?? data.data;
			const AdvancementClass = CONFIG.Advancement.types[advancement.type]?.documentClass;
			if (!advancement || !AdvancementClass) return false;

			if (
				!CONFIG.Advancement.types[advancement.type].validItemTypes?.has(this.item.type) ||
				!AdvancementClass.availableForItem(this.item)
			) {
				ui.notifications.error("BF.Advancement.Core.Warning.CantBeAdded", { localize: true });
				return false;
			}

			delete advancement._id;
			this.item.createEmbeddedDocuments("Advancement", [advancement]);
			// TODO: If item is on an actor, apply initial advancement
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
		if (data.type !== "Advancement") return false;
		if (!data.uuid) return true;
		return !data.uuid.startsWith(this.item.uuid);
	}
}
