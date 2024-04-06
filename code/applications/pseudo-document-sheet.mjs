/**
 * Extension of FormApplication to incorporate certain PseudoDocument-specific logic.
 */
export default class PseudoDocumentSheet extends FormApplication {
	constructor(pseudoDocument, options = {}) {
		super(pseudoDocument, options);
		this.#pseudoDocumentId = pseudoDocument.id;
		this.#pseudoDocumentType = pseudoDocument.metadata.name;
		this.#item = pseudoDocument.item;
	}

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

	get isEditable() {
		let editable = this.options.editable && this.item.isOwner;
		if (this.item.pack) {
			const pack = game.packs.get(this.item.pack);
			if (pack.locked) editable = false;
		}
		return editable;
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
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	async close(options = {}) {
		await super.close(options);
		delete this.document.apps[this.appId];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		context.document = this.document;
		context.editable = this.isEditable;
		context.options = this.options;
		context.owner = this.document.isOwner;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	render(force = false, options = {}) {
		this.document.apps[this.appId] = this;
		return super.render(force, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _renderOuter() {
		const html = await super._renderOuter();
		this._createDocumentIdLink(html);
		return html;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create an ID link button in the document sheet header which displays the document ID and copies to clipboard.
	 * @param {jQuery} html
	 * @protected
	 */
	_createDocumentIdLink(html) {
		if (!this.object.id) return;
		const title = html.find(".window-title");
		const label = game.i18n.localize(this.object.constructor.metadata.label);
		const idLink = document.createElement("a");
		idLink.classList.add("document-id-link");
		idLink.setAttribute("alt", "Copy document id");
		idLink.dataset.tooltip = `${label}: ${this.object.id}`;
		idLink.dataset.tooltipDirection = "UP";
		idLink.innerHTML = '<i class="fa-solid fa-passport"></i>';
		idLink.addEventListener("click", event => {
			event.preventDefault();
			game.clipboard.copyPlainText(this.object.id);
			ui.notifications.info(game.i18n.format("DOCUMENT.IdCopiedClipboard", { label, type: "id", id: this.object.id }));
		});
		idLink.addEventListener("contextmenu", event => {
			event.preventDefault();
			game.clipboard.copyPlainText(this.object.uuid);
			ui.notifications.info(
				game.i18n.format("DOCUMENT.IdCopiedClipboard", { label, type: "uuid", id: this.object.uuid })
			);
		});
		title.append(idLink);
	}
}
