import { log } from "../../utils/_module.mjs";
import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying the active effects on actor or item sheets.
 */
export default class EffectsElement extends AppAssociatedElement {

	connectedCallback() {
		super.connectedCallback();

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this.#onAction(event.currentTarget, event.currentTarget.dataset.action);
			});
		}

		const contextOptions = this.#getContextMenuOptions();
		/**
		 * A hook event that fires when the context menu for the effects list is constructed.
		 * @function blackFlag.getActiveEffectContext
		 * @memberof hookEvents
		 * @param {ActivitiesElement} html - The HTML element to which the context options are attached.
		 * @param {ContextMenuEntry[]} entryOptions - The context menu entries.
		 */
		Hooks.call("blackFlag.getActiveEffectContext", this, contextOptions);
		if ( contextOptions ) ContextMenu.create(this.app, this, "[data-effect-id]", contextOptions);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document represented by the app.
	 * @type {BlackFlagActor|BlackFlagItem}
	 */
	get document() {
		return this.app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Active effects collection stored on the item.
	 * @type {Collection<ActiveEffect>}
	 */
	get effects() {
		return this.document.effects;
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
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the provided effects collection for display.
	 * @param {Collection<BlackFlagActiveEffect>} effects
	 * @param {object} [options={}]
	 * @param {boolean} [options.displaySource=false] - Should the source column be displayed?
	 * @returns {object}
	 */
	static prepareContext(effects, { displaySource=false }={}) {
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
				crate: [],
				displaySource
			}
		};

		for ( const effect of effects ) {
			if ( effect.disabled ) context.inactive.effects.push(effect);
			else if ( effect.isTemporary ) context.temporary.effects.push(effect);
			else context.passive.effects.push(effect);
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the set of ContextMenu options which should be applied for activity entries.
	 * @returns {ContextMenuEntry[]} - Context menu entries.
	 */
	#getContextMenuOptions() {
		return [
			{
				name: "BF.Effect.Action.Disable",
				icon: "<i class='fa-solid fa-times fa-fw'></i>",
				condition: li => {
					const id = li[0].closest("[data-effect-id]")?.dataset.effectId;
					const effect = this.effects.get(id);
					return this.isEditable && !effect?.disabled;
				},
				callback: li => this.#onAction(li[0], "toggle")
			},
			{
				name: "BF.Effect.Action.Enable",
				icon: "<i class='fa-solid fa-check fa-fw'></i>",
				condition: li => {
					const id = li[0].closest("[data-effect-id]")?.dataset.effectId;
					const effect = this.effects.get(id);
					return this.isEditable && effect?.disabled;
				},
				callback: li => this.#onAction(li[0], "toggle")
			},
			{
				name: "BF.Effect.Action.Edit",
				icon: "<i class='fa-solid fa-edit fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this.#onAction(li[0], "edit")
			},
			{
				name: "BF.Effect.Action.Duplicate",
				icon: "<i class='fa-solid fa-copy fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this.#onAction(li[0], "duplicate")
			},
			{
				name: "BF.Effect.Action.Delete",
				icon: "<i class='fa-solid fa-trash fa-fw'></i>",
				condition: li => this.isEditable,
				callback: li => this.#onAction(li[0], "delete"),
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
	#onAction(target, action) {
		const id = target.closest("[data-effect-id]")?.dataset.effectId;
		const effect = this.effects.get(id);
		if ( (action !== "add") && !effect ) return;
		switch ( action ) {
			case "add":
				const section = event.target.closest("[data-section-id]")?.dataset.sectionId;
				return this.document.createEmbeddedDocuments("ActiveEffect", [{
					label: game.i18n.localize("BF.Effect.New"),
					icon: (this.document instanceof Item) ? this.document.img : "icons/svg/aura.svg",
					origin: this.document.uuid,
					duration: {
						rounds: section === "temporary" ? 1 : undefined
					},
					disabled: section === "inactive"
				}]);
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
}
