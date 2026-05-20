import BFDocumentSheet from "../../api/document-sheet.mjs";
import PrimarySheetMixin from "../../api/primary-sheet-mixin.mjs";
import AdvancementElement from "../../components/advancement.mjs";
import EffectsElement from "../../components/effects.mjs";
import PrerequisiteConfig from "../config/prerequisite-config.mjs";

/**
 * Sheet upon which all other item sheets are based.
 */
export default class BaseItemSheet extends PrimarySheetMixin(BFDocumentSheet) {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			showConfiguration: BaseItemSheet.#showConfiguration,
			showIcon: BaseItemSheet.#showIcon,
			toggleIdentification: BaseItemSheet.#toggleIdentification
		},
		classes: ["item", "standard-form"],
		form: {
			submitOnChange: true
		},
		window: {
			controls: [
				{
					action: "toggleIdentification",
					icon: "fa-solid fa-wand-sparkles",
					label: "BF.IDENTIFIABLE.Action.Toggle",
					visible: BaseItemSheet.#canToggleIdentification
				}
			],
			resizable: true
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fields that will be enriched during data preparation.
	 * @type {object}
	 */
	static ENRICHED_FIELDS = {
		description: "system.description.value",
		unidentified: "system.unidentified.description"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		header: {
			template: "systems/black-flag/templates/item/header.hbs"
		},
		tabs: {
			template: "systems/black-flag/templates/shared/tabs-separate.hbs"
		},
		advancement: {
			container: { id: "sheet-body" },
			template: "systems/black-flag/templates/item/advancement.hbs",
			templates: ["systems/black-flag/templates/item/parts/advancement-section.hbs"],
			scrollable: [""]
		},
		description: {
			container: { id: "sheet-body" },
			template: "systems/black-flag/templates/item/description.hbs",
			scrollable: [""]
		},
		details: {
			container: { id: "sheet-body" },
			template: "systems/black-flag/templates/item/details.hbs",
			scrollable: [""]
		},
		effects: {
			container: { id: "sheet-body" },
			template: "systems/black-flag/templates/item/effects.hbs",
			templates: ["systems/black-flag/templates/item/parts/effects-section.hbs"],
			scrollable: [""]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static TABS = [
		{ tab: "description", label: "BF.Sheet.Tab.Description" },
		{ tab: "details", label: "BF.Sheet.Tab.Details", condition: this.itemHasDetails.bind(this) },
		{ tab: "effects", label: "BF.Sheet.Tab.Effects", condition: this.itemHasEffects.bind(this) },
		{ tab: "advancement", label: "BF.Sheet.Tab.Advancement", condition: this.itemHasAdvancement.bind(this) }
	];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	tabGroups = {
		primary: "description"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The Actor owning the item, if any.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.document.actor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The Item document managed by this sheet.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_configureRenderParts(options) {
		const parts = super._configureRenderParts(options);
		if (!BaseItemSheet.itemHasAdvancement(this.item)) delete parts.advancement;
		if (!BaseItemSheet.itemHasDetails(this.item)) delete parts.details;
		if (!BaseItemSheet.itemHasEffects(this.item)) delete parts.effects;
		return parts;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = {
			...(await super._prepareContext(options)),
			fields: this.item.system.schema.fields,
			flags: this.item.flags,
			isIdentified: this.item.system.identified !== false,
			item: this.item,
			system: this.item.system,
			user: game.user
		};
		context.source = context.editable ? this.item.system._source : this.item.system;

		await this.item.system.getSheetData?.(context, options);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "advancement":
				context = await this._prepareAdvancementContext(context, options);
				break;
			case "description":
				context = await this._prepareDescriptionContext(context, options);
				break;
			case "details":
				context = await this._prepareDetailsContext(context, options);
				break;
			case "effects":
				context = await this._prepareEffectsContext(context, options);
				break;
			case "header":
				context = await this._prepareHeaderContext(context, options);
				break;
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the advancement tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareAdvancementContext(context, options) {
		context.advancement = AdvancementElement.prepareContext(this.item.system.advancement);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the description tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareDescriptionContext(context, options) {
		context.enriched = {};
		const enrichmentContext = {
			relativeTo: this.item,
			rollData: this.item.getRollData(),
			secrets: this.item.isOwner
		};
		for (const [key, path] of Object.entries(this.constructor.ENRICHED_FIELDS)) {
			context.enriched[key] = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
				foundry.utils.getProperty(context, path),
				enrichmentContext
			);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the details tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareDetailsContext(context, options) {
		context.activities = this.item.system.activities?.filter(a => a.canConfigure);
		context.usesRecovery = (context.system.uses?.recovery ?? []).map((data, index) => ({
			data,
			fields: context.fields.uses.fields.recovery.element.fields,
			prefix: `system.uses.recovery.${index}.`,
			source: context.source.uses.recovery[index] ?? data
		}));
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the effects tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareEffectsContext(context, options) {
		context.effects = EffectsElement.prepareItemContext(this.item.effects);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the header.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareHeaderContext(context, options) {
		if (this.item.system.identified === false)
			context.name = {
				value: this.item.system.unidentified.name,
				editable: this.item.system._source.unidentified.name,
				field: this.item.system.schema.getField("unidentified.name")
			};
		else
			context.name = {
				value: this.item.name,
				editable: this.item._source.name,
				field: this.item.schema.getField("name")
			};
		context.img = {
			value: this.item.img,
			editable: this.item._source.img
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Life-Cycle Handlers         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onRender(context, options) {
		await super._onRender(context, options);

		new CONFIG.ux.DragDrop({
			dragSelector: null,
			dropSelector: null,
			callbacks: {
				drop: this._onDrop.bind(this)
			}
		}).bind(this.element);

		this.element.classList.toggle("unidentified", this.item.system.identifiable && !this.item.system.identified);

		if (this._mode === this.constructor.MODES.PLAY) this._toggleDisabled(true);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle opening a configuration application.
	 * @this {BaseItemSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 * @returns {any}
	 */
	static async #showConfiguration(event, target) {
		if ((await this._showConfiguration(event, target)) === false) return;
		const config = { document: this.item };

		switch (target.dataset.type) {
			case "prerequisite":
				return this._renderChild(new PrerequisiteConfig(config));
		}
	}

	/**
	 * Handle opening a configuration application.
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 * @returns {any} - Return `false` to prevent default behavior.
	 */
	async _showConfiguration(event, target) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle showing the Item's art.
	 * @this {BaseItemSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #showIcon(event, target) {
		this._renderChild(
			new foundry.applications.apps.ImagePopout({
				src: this.item.img,
				uuid: this.item.uuid,
				window: { title: this.item.system.identified === false ? this.item.system.unidentified.name : this.item.name }
			})
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle toggling the identified status of Item.
	 * @this {BaseItemSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #toggleIdentification(event, target) {
		this.item.system.toggleIdentification?.();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Detached Windows           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_renderChild(app, options = {}) {
		if (this.parent) return this.parent.renderChild(app, options);
		if (this.window?.windowId)
			return app.render({
				force: true,
				window: { detached: true, windowId: this.window.windowId },
				...options
			});
		return app.render({ force: true, ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_canDragDrop() {
		return this.isEditable;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An event that occurs when data is dropped into a drop target.
	 * @param {DragEvent} event
	 * @returns {Promise<void>}
	 * @protected
	 */
	async _onDrop(event) {
		const { data } = CONFIG.ux.DragDrop.getDragData(event);

		// Forward dropped items to the advancement element
		// TODO: Handle folders
		if (data.type === "Advancement") {
			const advancementElement = this.element.querySelector("blackFlag-advancement");
			return advancementElement?._onDrop(event);
		}

		if (data.type === "ActiveEffect") {
			const effectsElement = this.element.querySelector("blackFlag-effects");
			return effectsElement?._onDrop(event);
		}

		const isSpell = data.type === "Item" && fromUuidSync(data.uuid, { strict: false })?.type === "spell";
		if (data.type === "Activity" || isSpell) {
			const activitiesElement = this.element.querySelector("blackFlag-activities");
			return activitiesElement?._onDrop(event);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Control whether the Toggle Identification button is visible.
	 * @this {BaseItemSheet}
	 * @returns {boolean}
	 */
	static #canToggleIdentification() {
		return this.item.system.identifiable && game.user.isGM;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine whether an Item is considered identified.
	 * @param {BlackFlagItem} item - The Item.
	 * @returns {boolean}
	 */
	static isItemIdentified(item) {
		return game.user.isGM || item.system.identified !== false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine if an Item support Advancement.
	 * @param {BlackFlagItem} item - The Item.
	 * @returns {boolean}
	 */
	static itemHasAdvancement(item) {
		return "advancement" in item.system;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine if an Item should show an details tab.
	 * @param {BlackFlagItem} item - The Item.
	 * @returns {boolean}
	 */
	static itemHasDetails(item) {
		return item.system.constructor.metadata.hasDetails && this.isItemIdentified(item);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine if an Item should show an effects tab.
	 * @param {BlackFlagItem} item - The Item.
	 * @returns {boolean}
	 */
	static itemHasEffects(item) {
		return item.system.constructor.metadata.hasEffects && this.isItemIdentified(item);
	}
}
