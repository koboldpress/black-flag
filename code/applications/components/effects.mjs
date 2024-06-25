import { log } from "../../utils/_module.mjs";
import BlackFlagContextMenu from "../context-menu.mjs";
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

		new BlackFlagContextMenu(this, "[data-effect-id]", [], { onOpen: this._onContextMenu.bind(this) });
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
	 * Prepare the provided effects collection for display.
	 * @param {Collection<BlackFlagActiveEffect>} effects
	 * @param {object} [options={}]
	 * @param {boolean} [options.displaySource=false] - Should the source column be displayed?
	 * @returns {object}
	 */
	static prepareContext(effects, { displaySource = false } = {}) {
		const context = {
			temporary: {
				label: "BF.Effect.Category.Temporary",
				effects: [],
				create: [],
				displaySource
			},
			passive: {
				label: "BF.Effect.Category.Passive",
				effects: [],
				create: [],
				displaySource
			},
			inactive: {
				label: "BF.Effect.Category.Inactive",
				effects: [],
				create: [],
				displaySource
			},
			suppressed: {
				label: "BF.Effect.Category.Suppressed",
				effects: [],
				displaySource
			}
		};

		for (const effect of effects) {
			const data = {
				...effect,
				id: effect.id,
				sourceName: effect.sourceName,
				parentId: effect.target === effect.parent ? null : effect.parent.id
			};
			if (effect.isSuppressed) {
				data.suppressionReason = game.i18n.format("BF.Effect.SuppressionReason.Description", {
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
				name: "BF.Effect.Action.View",
				icon: "<i class='fa-solid fa-eye fa-fw'></i>",
				condition: li => !this.isEditable,
				callback: li => this._onAction(li[0], "view")
			},
			{
				name: "BF.Effect.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "edit")
			},
			{
				name: "BF.Effect.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "duplicate")
			},
			{
				name: "BF.Effect.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this._onAction(li[0], "delete"),
				group: "destructive"
			},
			{
				name: `BF.Effect.Action.${effect.disabled ? "Enable" : "Disable"}`,
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
				const section = event.target.closest("[data-section-id]")?.dataset.sectionId;
				return this.document.createEmbeddedDocuments("ActiveEffect", [
					{
						label: game.i18n.localize("BF.Effect.New"),
						icon: this.document instanceof Item ? this.document.img : "icons/svg/aura.svg",
						origin: this.document.uuid,
						duration: {
							rounds: section === "temporary" ? 1 : undefined
						},
						disabled: section === "inactive"
					}
				]);
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
			default:
				return log(`Invalid effect action type clicked ${action}.`, { level: "warn" });
		}
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
