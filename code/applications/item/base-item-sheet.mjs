import DragDrop from "../drag-drop.mjs";
import DocumentSheetMixin from "../mixins/document-sheet-mixin.mjs";

/**
 * Sheet upon which all other item sheets are based.
 */
export default class BaseItemSheet extends DocumentSheetMixin(foundry.appv1.sheets.ItemSheet) {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			dragDrop: [{ dropSelector: "form" }]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fields that will be enriched during data preparation.
	 * @type {object}
	 */
	static enrichedFields = {
		description: "system.description.value"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.CONFIG = CONFIG.BlackFlag;
		context.flags = this.document.flags;
		context.name = this.modes.editing ? this.document._source.name : this.document.name;
		context.system = this.document.system;
		context.source = this.modes.editing ? this.document.toObject().system : context.system;

		const enrichmentContext = {
			relativeTo: this.item,
			rollData: this.item.getRollData(),
			secrets: this.item.isOwner,
			async: true
		};
		context.enriched = await Object.entries(this.constructor.enrichedFields).reduce(async (enriched, [key, path]) => {
			enriched[key] = await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
				foundry.utils.getProperty(context, path),
				enrichmentContext
			);
			return enriched;
		}, {});

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async activateEditor(name, options = {}, initialContent = "") {
		options.relativeLinks = true;
		options.plugins = {
			menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
				compact: true,
				destroyOnSave: true,
				onSave: () => this.saveEditor(name, { remove: true })
			})
		};
		return super.activateEditor(name, options, initialContent);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll("[data-action]")) {
			element.addEventListener("click", this._onAction.bind(this));
		}

		if (this.form && this.isEditable && !this.modes.editing) this._disableFields(this.form);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_disableFields(form) {
		super._disableFields(form);
		form.querySelectorAll("blackflag-multiselect").forEach(e => (e.disabled = true));
		form.querySelectorAll('[data-action="view"], .interface-only').forEach(b => (b.disabled = false));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a click on an action link.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async _onAction(event) {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_canDragDrop() {
		return this.isEditable;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDrop(event) {
		const { data } = DragDrop.getDragData(event);

		// Forward dropped items to the advancement element
		// TODO: Handle folders
		if (data.type === "Advancement") {
			const advancementElement = this.element[0].querySelector("blackFlag-advancement");
			return advancementElement?._onDrop(event);
		}

		const isSpell = data.type === "Item" && fromUuidSync(data.uuid, { strict: false })?.type === "spell";
		if (data.type === "Activity" || isSpell) {
			const activitiesElement = this.element[0].querySelector("blackFlag-activities");
			return activitiesElement?._onDrop(event);
		}

		super._onDrop(event);
	}
}
