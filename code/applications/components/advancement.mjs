import { log } from "../../utils/_module.mjs";
import AdvancementSelection from "../advancement/advancement-selection.mjs";
import BlackFlagContextMenu from "../context-menu.mjs";
import DragDrop from "../drag-drop.mjs";
import DocumentSheetAssociatedElement from "./document-sheet-associated-element.mjs";

/**
 * Custom element for displaying the advancement on an item sheet.
 */
export default class AdvancementElement extends DocumentSheetAssociatedElement {
	/** @inheritDoc */
	connectedCallback() {
		super.connectedCallback();
		this.#controller = new AbortController();
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

		new BlackFlagContextMenu(this, "[data-advancement-id]", [], {
			jQuery: true,
			onOpen: this._onContextMenu.bind(this)
		});
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
				icon: "<i class='fa-solid fa-eye fa-fw' inert></i>",
				condition: li => advancement && !this.isEditable,
				callback: li => this._onAction(li[0], "view")
			},
			{
				name: "BF.Advancement.Core.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw' inert></i>",
				condition: li => advancement && this.isEditable,
				callback: li => this._onAction(li[0], "edit")
			},
			{
				name: "BF.Advancement.Core.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw' inert></i>",
				condition: li => this.isEditable && advancement?.constructor.availableForItem(this.item),
				callback: li => this._onAction(li[0], "duplicate")
			},
			{
				name: "BF.JournalPage.Class.DisplayAdvancement",
				icon: `<i class="fa-regular fa-square${
					advancement?.getFlag(game.system.id, "hideOnClassTable") ? "" : "-check"
				} fa-fw"></i>`,
				condition: li => advancement && this.isEditable,
				callback: li => {
					if (advancement.getFlag(game.system.id, "hideOnClassTable") === true) {
						advancement.unsetFlag(game.system.id, "hideOnClassTable");
					} else {
						advancement.setFlag(game.system.id, "hideOnClassTable", true);
					}
				},
				group: "state"
			},
			{
				name: "BF.Advancement.Core.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw' inert></i>",
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
		const event = new CustomEvent("bf-advancement", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if (target.dispatchEvent(event) === false) return;

		const id = target.closest("[data-advancement-id]")?.dataset.advancementId;
		const advancement = this.advancement.get(id);
		if (["edit", "delete", "duplicate"].includes(action) && !advancement) return;
		switch (action) {
			case "add":
				return AdvancementSelection.createDialog(this.item);
			case "edit":
			case "view":
				return advancement.sheet.render({ force: true });
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
	/*             Drag & Drop             */
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
		if (data.uuid?.startsWith(this.item.uuid)) return false;
		if (!this._validateDrop(data)) return this.app._onDrop?.(event);

		try {
			const advancement = (await fromUuid(data.uuid)).toObject() ?? data.data;
			if (!advancement) return false;
			return this.constructor.dropAdvancement(event, this.document, [advancement]);
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
		return !data.uuid?.startsWith(this.item.uuid);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle an advancement dropped onto the sheet.
	 * @param {DragEvent} event - Triggering drop event.
	 * @param {BlackFlagItem} target - Document to which the advancement was dropped.
	 * @param {BlackFlagAdvancement[]} advancementData - One or more advancements dropped.
	 * @returns {Promise}
	 */
	static async dropAdvancement(event, target, advancementData) {
		const advancement = [];
		for (const data of advancementData) {
			const AdvancementClass = CONFIG.Advancement.types[data.type]?.documentClass;
			if (!AdvancementClass) continue;
			if (
				!CONFIG.Advancement.types[data.type].validItemTypes?.has(target.type) ||
				!AdvancementClass.availableForItem(target)
			) {
				ui.notifications.error("BF.Advancement.Core.Warning.CantBeAdded", { localize: true });
				return false;
			}

			delete data._id;
			advancement.push(data);
		}
		target.createEmbeddedDocuments("Advancement", advancement);
		// TODO: If item is on an actor, apply initial advancement
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle an item dropped onto the sheet.
	 * @param {DragEvent} event - Triggering drop event.
	 * @param {BlackFlagItem} target - Document to which the items were dropped.
	 * @param {BlackFlagAdvancement[]} itemData - One or more items dropped.
	 */
	static async dropItems(event, target, itemData) {
		const itemsByLevel = itemData.reduce((map, item) => {
			if (item.uuid && item.system.level?.value) {
				if (!map.has(item.system.level.value)) {
					map.set(item.system.level.value, []);
				}
				map.get(item.system.level.value).push(item.uuid);
			}
			return map;
		}, new Map());

		const advancementToCreate = [];
		const advancementUpdates = [];
		for (const [level, uuids] of itemsByLevel.entries()) {
			const advancement = target.system.advancement.byLevel(level).find(a => a.type === "grantFeatures");
			if (advancement) {
				const pool = advancement.toObject().configuration.pool;
				for (const uuid of uuids) {
					if (!pool.find(e => e.uuid === uuid)) pool.push({ uuid });
				}
				advancementUpdates.push({ _id: advancement.id, "configuration.pool": pool });
			} else {
				advancementToCreate.push({
					type: "grantFeatures",
					level: {
						value: level,
						classIdentifier:
							target.type === "class"
								? target.identifier
								: CONFIG.BlackFlag.registration.get("class", target.system.identifier?.associated)
									? target.system.identifier.associated
									: undefined
					},
					configuration: {
						pool: uuids.map(uuid => ({ uuid }))
					}
				});
			}
		}

		await target.createEmbeddedDocuments("Advancement", advancementToCreate);
		await target.updateEmbeddedDocuments("Advancement", advancementUpdates);
	}
}
