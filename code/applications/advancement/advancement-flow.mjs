import BaseActorSheet from "../actor/api/base-actor-sheet.mjs";
import BFApplication from "../api/application.mjs";

/**
 * @import { AdvancementLevels } from "../../documents/advancement/advancement.mjs";
 */

/**
 * Base class for the advancement interface displayed in the progression tab that should be subclassed by
 * individual advancement types.
 *
 * @param {BlackFlagActor} actor - Actor to which the advancement is being applied.
 * @param {Advancement} advancement - Advancement being represented.
 * @param {AdvancementLevels} levels - Level for which to configure this flow.
 * @param {object} [options={}] - Application rendering options.
 */
export default class AdvancementFlow extends BFApplication {
	constructor(options, advancement, levels, _options = {}) {
		super(options);
		this.#advancementId = options.advancement.id;
		this.#item = options.advancement.item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			reverse: AdvancementFlow.#reverse,
			viewItem: AdvancementFlow.#viewItem
		},
		advancement: null,
		classes: ["advancement-entry"],
		form: {
			handler: AdvancementFlow.#handleForm,
			submitOnChange: true
		},
		levels: null,
		tag: "form",
		window: {
			frame: false,
			positioned: false
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		name: {
			classes: ["advancement-name"],
			container: { id: "advancement-header", tag: "header" },
			template: "systems/black-flag/templates/advancement/advancement-flow-name.hbs"
		},
		actions: {
			classes: ["advancement-actions"],
			container: { id: "advancement-header", tag: "header" },
			template: "systems/black-flag/templates/advancement/advancement-flow-actions.hbs"
		},
		controls: {
			classes: ["advancement-controls"],
			container: { id: "advancement-header", tag: "header" },
			template: "systems/black-flag/templates/advancement/advancement-flow-controls.hbs"
		},
		content: {
			classes: ["advancement-summary"],
			template: "systems/black-flag/templates/advancement/advancement-flow-content.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * ID of the advancement this flow modifies.
	 * @type {string}
	 * @private
	 */
	#advancementId;

	/* <><><><> <><><><> <><><><> <><><><> */

	get actor() {
		return this.#item.actor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The Advancement object this flow modifies.
	 * @type {Advancement|null}
	 */
	get advancement() {
		return this.item.system.advancement?.get(this.#advancementId) ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The item that houses the Advancement.
	 * @type {BlackFlagItem}
	 */
	#item;

	get item() {
		return this.#item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Levels for which to configure this flow.
	 * @type {AdvancementLevels}
	 */
	get levels() {
		return this.options.levels;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Initialization            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_initializeApplicationOptions(options) {
		options = super._initializeApplicationOptions(options);
		options.uniqueId = `${options.advancement.uuid.replace(".", "-")}#${options.levels.character}`;
		return options;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		return {
			...(await super._prepareContext(options)),
			advancement: this.advancement,
			editable: this.actor.sheet.isEditable && this.actor.sheet._mode === BaseActorSheet.MODES.EDIT,
			needsConfiguration: !this.advancement.configuredForLevel(this.levels)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "actions":
				return this._prepareActionsContext(context, options);
			case "content":
				return this._prepareContentContext(context, options);
			case "controls":
				return this._prepareControlsContext(context, options);
			case "name":
				return this._prepareNameContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the flow actions.
	 * @param {Partial<ApplicationRenderContext>} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareActionsContext(context, options) {
		context.actions = [];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the flow contents.
	 * @param {Partial<ApplicationRenderContext>} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareContentContext(context, options) {
		context.summary = this.advancement.summaryForLevel(this.levels, { flow: true });
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the flow controls.
	 * @param {Partial<ApplicationRenderContext>} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareControlsContext(context, options) {
		context.showReverse = false;
		context.reverseLabel = "BF.Advancement.Core.Action.Revert";
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the flow name.
	 * @param {Partial<ApplicationRenderContext>} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareNameContext(context, options) {
		context.title = this.advancement.titleForLevel(this.levels, { flow: true });
		context.warningKey = this.advancement.warningKey(this.levels);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Life-Cycle Handlers         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);
		Object.assign(this.element.dataset, {
			id: this.advancement.id,
			level: this.level,
			type: this.advancement.constructor.typeName
		});
		if (this.item.accentColor) this.element.style.setProperty("--bf-item-color", this.item.accentColor);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle reversing the advancement's changes.
	 * @this {AdvancementFlow}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #reverse(event, target) {
		this.advancement.reverse(this.levels);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking on an item to open its sheet.
	 * @this {AdvancementFlow}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #viewItem(event, target) {
		const uuid = target.closest("[data-uuid]")?.dataset.uuid;
		const item = await fromUuid(uuid);
		item?.sheet.render(true);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle submission of the form.
	 * @this {AdvancementFlow}
	 * @param {Event} event - Triggering event.
	 * @param {HTMLFormElement} form - Form being handled.
	 * @param {FormDataExtended} formData - Data for the form.
	 */
	static async #handleForm(event, form, formData) {
		this._handleForm(event, formData);
	}

	/**
	 * Handle submission of the form.
	 * @param {Event} event - Triggering event.
	 * @param {FormDataExtended} formData - Data for the form.
	 * @protected
	 */
	async _handleForm(event, formData) {
		await this.advancement.apply(this.levels, formData.object);
	}
}
