import BFApplication from "./application.mjs";

/**
 * Extension of FormApplication to incorporate certain PseudoDocument-specific logic.
 */
export default class PseudoDocumentSheet extends BFApplication {
	constructor(pseudoDocument, options = {}) {
		super({ document: pseudoDocument, ...options });
		this.#pseudoDocumentId = pseudoDocument.id;
		this.#pseudoDocumentType = pseudoDocument.metadata.name;
		this.#item = pseudoDocument.item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		id: "{id}",
		classes: ["sheet"],
		tag: "form",
		document: null,
		viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		actions: {
			copyUuid: { handler: PseudoDocumentSheet.#onCopyUuid, buttons: [0, 2] },
			toggleCollapsed: PseudoDocumentSheet.#toggleCollapsed
		},
		form: {
			handler: this.#onSubmitDocumentForm,
			submitOnChange: true,
			closeOnSubmit: false
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The ID of the pseudo document being created or edited.
	 * @type {string}
	 */
	#pseudoDocumentId;

	/**
	 * Collection representing this PseudoDocument.
	 * @type {string}
	 */
	#pseudoDocumentType;

	/**
	 * The PseudoDocument represented by this sheet.
	 * @type {PseudoDocument}
	 */
	get document() {
		return this.item.getEmbeddedDocument(this.#pseudoDocumentType, this.#pseudoDocumentId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Expanded states for additional settings sections.
	 * @type {Map<string, boolean>}
	 */
	#expandedSections = new Map();

	get expandedSections() {
		return this.#expandedSections;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this PseudoDocument sheet visible to the current User?
	 * This is governed by the viewPermission threshold configured for the class.
	 * @type {boolean}
	 */
	get isVisible() {
		return this.item.testUserPermission(game.user, this.options.viewPermission);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this PseudoDocument sheet editable by the current User?
	 * This is governed by the editPermission threshold configured for the class.
	 * @type {boolean}
	 */
	get isEditable() {
		if (this.item.pack) {
			const pack = game.packs.get(this.item.pack);
			if (pack.locked) return false;
		}
		return this.item.testUserPermission(game.user, this.options.editPermission);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Parent item to which this PseudoDocument belongs.
	 * @type {BlackFlagItem}
	 */
	#item;

	get item() {
		return this.#item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Initialization            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_initializeApplicationOptions(options) {
		options = super._initializeApplicationOptions(options);
		options.uniqueId = CSS.escape(`${this.constructor.name}-${options.document.uuid}`);
		return options;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.document = this.document;
		context.editable = this.isEditable;
		context.options = this.options;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _renderFrame(options) {
		const frame = await super._renderFrame(options);

		// Add form options
		if (this.options.tag === "form") frame.autocomplete = "off";

		// Add document ID copy
		const copyLabel = game.i18n.localize("SHEETS.CopyUuid");
		const copyId = `<button type="button" class="header-control fa-solid fa-passport icon" data-action="copyUuid"
														data-tooltip="${copyLabel}" aria-label="${copyLabel}"></button>`;
		this.window.close.insertAdjacentHTML("beforebegin", copyId);

		return frame;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Life-Cycle Handlers         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_canRender(_options) {
		if (!this.isVisible)
			throw new Error(
				game.i18n.format("SHEETS.DocumentSheetPrivate", {
					type: game.i18n.localize(this.document.constructor.metadata.label)
				})
			);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onFirstRender(context, options) {
		super._onFirstRender(context, options);
		this.document.constructor._registerApp(this.document, this);
		this.item.apps[this.id] = this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onRender(context, options) {
		super._onRender(context, options);

		for (const element of this.element.querySelectorAll("[data-expand-id]")) {
			element
				.querySelector(".collapsible")
				?.classList.toggle("collapsed", !this.#expandedSections.get(element.dataset.expandId));
		}
		if (!this.isEditable) this._disableFields();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_onClose(_options) {
		this.document.constructor._unregisterApp(this.document, this);
		delete this.item?.apps[this.id];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle click events to copy the UUID of this document to clipboard.
	 * @this {PseudoDocumentSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 * @this {DocumentSheetV2}
	 */
	static #onCopyUuid(event, target) {
		event.preventDefault(); // Don't open context menu
		event.stopPropagation(); // Don't trigger other events
		if (event.detail > 1) return; // Ignore repeated clicks
		const id = event.button === 2 ? this.document.id : this.document.uuid;
		const type = event.button === 2 ? "id" : "uuid";
		const label = game.i18n.localize(this.document.constructor.metadata.label);
		game.clipboard.copyPlainText(id);
		ui.notifications.info(game.i18n.format("DOCUMENT.IdCopiedClipboard", { label, type, id }));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle toggling the collapsed state of an additional settings section.
	 * @this {PseudoDocumentSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #toggleCollapsed(event, target) {
		if (event.target.closest(".collapsible-content")) return;
		target.classList.toggle("collapsed");
		this.#expandedSections.set(
			target.closest("[data-expand-id]")?.dataset.expandId,
			!target.classList.contains("collapsed")
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Process form submission for the sheet.
	 * @this {PseudoDocumentSheet}
	 * @param {SubmitEvent} event - The originating form submission event.
	 * @param {HTMLFormElement} form - The form element that was submitted.
	 * @param {FormDataExtended} formData - Processed data for the submitted form.
	 * @returns {Promise<void>}
	 */
	static async #onSubmitDocumentForm(event, form, formData) {
		const submitData = this._prepareSubmitData(event, form, formData);
		await this._processSubmitData(event, form, submitData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data used to update the PseudoDocument upon form submission.
	 * @param {SubmitEvent} event -  The originating form submission event.
	 * @param {HTMLFormElement} form - The form element that was submitted.
	 * @param {FormDataExtended} formData - Processed data for the submitted form.
	 * @returns {object} - Prepared submission data as an object.
	 * @protected
	 */
	_prepareSubmitData(event, form, formData) {
		const submitData = this._processFormData(event, form, formData);
		// TODO: Handle validation
		return submitData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Customize how form data is extracted into an expanded object.
	 * @param {SubmitEvent} event - The originating form submission event.
	 * @param {HTMLFormElement} form - The form element that was submitted.
	 * @param {FormDataExtended} formData - Processed data for the submitted form.
	 * @returns {object} - An expanded object of processed form data.
	 */
	_processFormData(event, form, formData) {
		return foundry.utils.expandObject(formData.object);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Submit a document update based on the processed form data.
	 * @param {SubmitEvent} event - The originating form submission event.
	 * @param {HTMLFormElement} form - The form element that was submitted.
	 * @param {object} submitData - Processed and validated form data to be used for a document update.
	 * @returns {Promise<void>}
	 * @protected
	 */
	async _processSubmitData(event, form, submitData) {
		await this.document.update(submitData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Programmatically submit the form, providing additional data to be merged with form data.
	 * @param {object} options
	 * @param {object} [options.updateData] - Additional data merged with processed form data
	 * @returns {Promise<void>}
	 */
	async submit({ updateData } = {}) {
		const formConfig = this.options.form;
		if (!formConfig?.handler)
			throw new Error(
				`The ${this.constructor.name} PseudoDocumentSheet does not support a single top-level form element.`
			);
		const form = this.element;
		const event = new Event("submit");
		const formData = new (foundry.applications?.ux?.FormDataExtended ?? FormDataExtended)(form);
		const submitData = this._prepareSubmitData(event, form, formData);
		foundry.utils.mergeObject(submitData, updateData, { inplace: true });
		await this._processSubmitData(event, form, submitData);
	}
}
