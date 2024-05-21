/**
 * Presents a list of pseudo document types to create.
 *
 * @param {BlackFlagItem} item - Item to which this pseudo document will be added.
 * @param {object} [dialogData={}] - An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}] - Dialog rendering options.
 */
export default class PseudoDocumentSelection extends Dialog {
	constructor(item, dialogData = {}, options = {}) {
		super(dialogData, options);
		this.item = item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The Item to which this Pseudo Document is being added.
	 * @type {BlackFlagItem}
	 */
	item;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "dialog", "pseudo-document-selection"],
			template: "systems/black-flag/templates/pseudo-document-selection.hbs",
			width: 500,
			height: "auto",
			type: null,
			errorMessage: ""
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const [html] = jQuery;

		html.querySelector("button").addEventListener("click", this._onClickButton.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A helper constructor function which displays the selection dialog and returns a Promise once its workflow has
	 * been resolved.
	 * @param {BlackFlagItem} item - Item to which the advancement should be added.
	 * @param {object} [config={}]
	 * @param {boolean} [config.rejectClose=false] - Trigger a rejection if the window was closed without a choice.
	 * @param {object} [config.options={}] - Additional rendering options passed to the Dialog.
	 * @returns {Promise<AdvancementConfig|null>} - Result of `BlackFlagItem#createAdvancement`.
	 */
	static async createDialog(item, { rejectClose = false, options = {} } = {}) {
		return new Promise((resolve, reject) => {
			const dialog = new this(
				item,
				{
					title: `${this.defaultOptions.title}: ${item.name}`,
					buttons: {
						submit: {
							callback: html => {
								const formData = new FormDataExtended(html.querySelector("form"));
								const type = formData.object.type;
								if (!type) throw new Error(game.i18n.localize(this.defaultOptions.errorMessage));
								resolve(item.createEmbeddedDocuments(this.defaultOptions.type, [{ type }], { renderSheet: true }));
							}
						}
					},
					close: () => {
						if (rejectClose) reject(game.i18n.localize(this.defaultOptions.errorMessage));
						else resolve(null);
					}
				},
				foundry.utils.mergeObject(options, { jQuery: false })
			);
			dialog.render(true);
		});
	}
}
