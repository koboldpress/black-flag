import { log } from "../../utils/_module.mjs";

/**
 * Custom element for displaying the active effects on actor or item sheets.
 */
export default class EffectsElement extends HTMLElement {

	connectedCallback() {
		this.#app = ui.windows[this.closest(".app")?.dataset.appid];

		for ( const element of this.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", event => {
				event.stopImmediatePropagation();
				this.#onAction(event.currentTarget, event.currentTarget.dataset.action);
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reference to the application that contains this component.
	 * @type {Application}
	 */
	#app;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document represented by the app.
	 * @type {BlackFlagActor|BlackFlagItem}
	 */
	get document() {
		return this.#app.document;
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
	 * Handle one of the actions from the buttons or context menu.
	 * @param {Element} target - Button or context menu entry that triggered this action.
	 * @param {string} action - Action being triggered.
	 * @returns {Promise|void}
	 */
	#onAction(target, action) {
		const id = target.closest("[data-effect-id]")?.dataset.effectId;
		const effect = this.effects.get(id);
		const section = event.target.closest("[data-section-id]")?.dataset.sectionId;
		if ( ["edit", "delete", "duplicate", "toggle", "view"].includes(action) && !effect ) return;
		switch ( action ) {
			case "add":
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
			case "toggle":
				return effect.update({ disabled: !effect.disabled });
			default:
				return log(`Invalid effect action type clicked ${action}.`, { level: "warn" });
		}
	}
}
