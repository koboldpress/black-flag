import { log } from "../../utils/_module.mjs";
import BlackFlagContextMenu from "../context-menu.mjs";
import DragDrop from "../drag-drop.mjs";
import DocumentSheetAssociatedElement from "./document-sheet-associated-element.mjs";

/**
 * Custom element for displaying the active effects on actor or item sheets.
 */
export default class EffectsElement extends DocumentSheetAssociatedElement {
	/** @inheritDoc */
	connectedCallback() {
		super.connectedCallback();
		this.#controller = new AbortController();
		const { signal } = this.#controller;

		this.addEventListener("drop", this._onDrop.bind(this), { signal });

		for (const element of this.querySelectorAll("[data-effect-id]")) {
			element.setAttribute("draggable", true);
			element.ondragstart = this._onDragStart.bind(this);
		}

		for (const element of this.querySelectorAll("[data-action]")) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this._onAction(event.currentTarget, event.currentTarget.dataset.action);
			});
		}

		for (const control of this.querySelectorAll("[data-context-menu]")) {
			control.addEventListener(
				"click",
				event => {
					event.stopPropagation();
					event.currentTarget.closest("[data-effect-id]").dispatchEvent(
						new PointerEvent("contextmenu", {
							view: window,
							bubbles: true,
							cancelable: true,
							clientX: event.clientX,
							clientY: event.clientY
						})
					);
				},
				{ signal }
			);
		}

		new BlackFlagContextMenu(this, "[data-effect-id]", [], { jQuery: true, onOpen: this._onContextMenu.bind(this) });
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
	 * Controller for handling removal of event listeners.
	 * @type {AbortController}
	 */
	#controller;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the provided effects collection for display on an actor sheet.
	 * @param {Collection<BlackFlagActiveEffect>} effects
	 * @returns {object}
	 */
	static prepareActorContext(effects) {
		const context = {
			temporary: { label: "BF.EFFECT.Category.Temporary", effects: [] },
			passive: { label: "BF.EFFECT.Category.Passive", effects: [] },
			inactive: { label: "BF.EFFECT.Category.Inactive", effects: [] },
			suppressed: { label: "BF.EFFECT.Category.Suppressed", effects: [] }
		};

		for (const effect of effects) {
			const data = {
				...effect,
				id: effect.id,
				sourceName: effect.sourceName,
				parentId: effect.target === effect.parent ? null : effect.parent.id
			};
			if (effect.isSuppressed) {
				data.suppressionReason = game.i18n.format("BF.EFFECT.SuppressionReason.Description", {
					item: effect.parent.name,
					reasons: game.i18n
						.getListFormatter({ style: "short" })
						.format(effect.suppressionReasons.map(r => game.i18n.localize(r)))
				});
				context.suppressed.effects.push(data);
			} else if (effect.disabled) context.inactive.effects.push(data);
			else if (effect.isTemporary) context.temporary.effects.push(data);
			else context.passive.effects.push(data);
		}
		if (!context.suppressed.effects.length) delete context.suppressed;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the provided effects collection for display on an item sheet.
	 * @param {Collection<BlackFlagActiveEffect>} effects
	 * @returns {object}
	 */
	static prepareItemContext(effects) {
		const context = {
			base: {
				id: "base",
				label: "BF.EFFECT.Label[other]",
				effects: [],
				show: { duration: true, source: false, transfer: true }
			},
			enchantment: {
				id: "enchantment",
				label: "BF.EFFECT.Type.Enchantment[other]",
				effects: [],
				show: { duration: false, source: true, transfer: false }
			}
		};

		for (const effect of effects) {
			const data = {
				...effect,
				id: effect.id
			};
			if (effect.type === "enchantment") context.enchantment.effects.push(data);
			else context.base.effects.push(data);
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied for activity entries.
	 * @param {BlackFlagActiveEffect} effect - The effect for which the context menu is being activated.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 * @protected
	 */
	_getContextMenuOptions(effect) {
		return [
			{
				name: "BF.EFFECT.Action.View",
				icon: "<i class='fa-solid fa-eye fa-fw'></i>",
				condition: li => !this.isEditable,
				callback: li => this._onAction(li[0], "view")
			},
			{
				name: "BF.EFFECT.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "edit")
			},
			{
				name: "BF.EFFECT.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "duplicate")
			},
			{
				name: "BF.EFFECT.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "delete"),
				group: "destructive"
			},
			{
				name: `BF.EFFECT.Action.${effect.disabled ? "Enable" : "Disable"}`,
				icon: `<i class='fa-solid fa-${effect.disabled ? "check" : "times"} fa-fw'></i>`,
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "toggle"),
				group: "state"
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle one of the actions from the buttons or context menu.
	 * @param {Element} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise|void}
	 * @protected
	 */
	_onAction(target, action) {
		const event = new CustomEvent("bf-effect", {
			bubbles: true,
			cancelable: true,
			detail: action
		});
		if (target.dispatchEvent(event) === false) return;

		const effect = this.getEffect(target.closest("[data-effect-id]")?.dataset);
		if (action !== "add" && !effect) return;

		switch (action) {
			case "add":
				return this._onAddEffect(target);
			case "edit":
			case "view":
				return effect.sheet.render(true);
			case "delete":
				return effect.deleteDialog();
			case "duplicate":
				const data = effect.toObject();
				delete data._id;
				return this.document.createEmbeddedDocuments("ActiveEffect", [data]);
			case "toggle":
				return effect.update({ disabled: !effect.disabled });
			case "transfer":
				return effect.update({ transfer: !effect.transfer });
			default:
				return log(`Invalid effect action type clicked ${action}.`, { level: "warn" });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle creating a new effect within a certain section.
	 * @param {HTMLElement} target - Button or context menu entry that triggered this action.
	 * @protected
	 */
	_onAddEffect(target) {
		const section = event.target.closest("[data-section-id]")?.dataset.sectionId;
		const isEnchantment = section === "enchantment";
		const isItem = this.document instanceof Item;
		this.document.createEmbeddedDocuments("ActiveEffect", [
			{
				type: isEnchantment ? "enchantment" : "base",
				name: isItem ? this.document.name : game.i18n.localize("BF.EFFECT.New"),
				icon: isItem ? this.document.img : "icons/svg/aura.svg",
				origin: isEnchantment ? undefined : this.document.uuid,
				duration: {
					rounds: section === "temporary" ? 1 : undefined
				},
				disabled: section === "inactive"
			}
		]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle opening the context menu.
	 * @param {HTMLElement} element - The element the context menu was triggered on.
	 * @protected
	 */
	_onContextMenu(element) {
		const effect = this.getEffect(element.closest("[data-effect-id]")?.dataset);
		ui.context.menuItems = this._getContextMenuOptions(effect);
		/**
		 * A hook event that fires when the context menu for an effects list is constructed.
		 * @function blackFlag.getEffectsContext
		 * @memberof hookEvents
		 * @param {InventoryElement} html - The HTML element to which the context options are attached.
		 * @param {BlackFlagActiveEffect} effect - The effect for which the context options are being prepared.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getEffectsContext", this, effect, ui.context.menuItems);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Begin dragging an entry.
	 * @param {DragEvent} event - Triggering drag event.
	 */
	_onDragStart(event) {
		const effect = this.getEffect(event.currentTarget.dataset);
		DragDrop.beginDragEvent(event, effect);
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
		if (!this._validateDrop(data)) return this.app._onDrop?.(event);

		try {
			const effect = (await fromUuid(data.uuid)).toObject() ?? data.data;
			if (!effect) return false;
			return this.constructor.dropEffects(event, this.document, [effect]);
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
		if (data.type !== "ActiveEffect") return false;
		if (!data.uuid) return true;
		return !data.uuid.startsWith(this.document.uuid);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle an effect dropped onto the sheet.
	 * @param {DragEvent} event - Triggering drop event.
	 * @param {BlackFlagItem} target - Document to which the advancement was dropped.
	 * @param {BlackFlagActiveEffect[]} effectData - One or more effects dropped.
	 * @returns {Promise}
	 */
	static async dropEffects(event, target, effectData) {
		target.createEmbeddedDocuments("ActiveEffect", effectData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve an effect with the specified ID.
	 * @param {object} [data]
	 * @param {string} [data.effectId] - ID of the effect to fetch.
	 * @param {string} [data.parentId] - ID of the parent item that contains this effect, if a grandchild effect.
	 * @returns {BlackFlagActiveEffect}
	 */
	getEffect({ effectId, parentId } = {}) {
		if (!parentId) return this.document.effects.get(effectId);
		return this.document.items.get(parentId).effects.get(effectId);
	}
}
