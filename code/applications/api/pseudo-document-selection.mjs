const { DialogV2 } = foundry.applications.api;

/**
 * Presents a list of pseudo document types to create.
 *
 * @param {BlackFlagItem} item - Item to which this pseudo document will be added.
 * @param {object} [dialogData={}] - An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}] - Dialog rendering options.
 */
export default class PseudoDocumentSelection extends DialogV2 {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["black-flag", "pseudo-document-selection"],
		errorMessage: "",
		item: null,
		position: {
			width: 500
		},
		type: null
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Template to use when rendering the dialog.
	 * @type {string}
	 */
	static TEMPLATE = "systems/black-flag/templates/pseudo-document-selection.hbs";

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item to which this pseudo document is being added.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.options.item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _renderHTML(context, options) {
		const form = await super._renderHTML(context, options);
		const content = await renderTemplate(this.constructor.TEMPLATE, context);
		form.insertAdjacentHTML("afterbegin", `<div class="dialog-content standard-form">${content}</div>`);
		if (context.buttonLabel) {
			form.querySelector("button").innerHTML = `<i class="fa-regular fa-save" inert></i> ${context.buttonLabel}`;
		}
		return form;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A helper constructor function which displays the selection dialog and returns a Promise once its workflow has
	 * been resolved.
	 * @param {BlackFlagItem} item - Item to which the advancement should be added.
	 * @param {object} [config={}]
	 * @param {boolean} [config.rejectClose=false] - Trigger a rejection if the window was closed without a choice.
	 * @param {object} [config.options={}] - Additional rendering options passed to the Dialog.
	 * @returns {Promise<PseudoDocument[]|null>} - Result of the creation operation.
	 */
	static async createDialog(item, { rejectClose = false, options = {} } = {}) {
		return new Promise((resolve, reject) => {
			const dialog = new this(
				foundry.utils.mergeObject(
					{
						item,
						buttons: [
							{
								action: "submit",
								callback: (event, target, html) => {
									const formData = new FormDataExtended(html.querySelector("form"));
									const type = formData.object.type;
									if (!type) throw new Error(game.i18n.localize(this.DEFAULT_OPTIONS.errorMessage));
									resolve(item.createEmbeddedDocuments(this.DEFAULT_OPTIONS.type, [{ type }], { renderSheet: true }));
								},
								label: game.i18n.localize("Submit"),
								icon: "fa-regular fa-save"
							}
						],
						close: () => {
							if (rejectClose) reject(game.i18n.localize(this.DEFAULT_OPTIONS.errorMessage));
							else resolve(null);
						}
					},
					options
				)
			);
			dialog.render({ force: true });
		});
	}
}
