/**
 * Presents a list of advancement types to create when clicking the new advancement button.
 * Once a type is selected, this hands the process over to the advancement's individual editing interface.
 *
 * @param {BlackFlagItem} item - Item to which this advancement will be added.
 * @param {object} [dialogData={}] - An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}] - Dialog rendering options.
 */
export default class AdvancementSelection extends Dialog {
	constructor(item, dialogData={}, options={}) {
		super(dialogData, options);
		this.item = item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The Item to which this Advancement is being added.
	 * @type {BlackFlagItem}
	 */
	item;

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "dialog", "advancement-selection"],
			template: "systems/black-flag/templates/advancement/advancement-selection.hbs",
			title: "BF.Advancement.Selection.Title",
			width: 500,
			height: "auto"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get id() {
		return `item-${this.item.id}-advancement-selection`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData() {
		const context = { types: {} };
		for ( const [name, config] of Object.entries(CONFIG.Advancement.types) ) {
			const advancement = config.documentClass;
			if ( !(advancement.prototype instanceof BlackFlag.documents.advancement.Advancement)
				|| !config.validItemTypes.has(this.item.type) ) continue;
			context.types[name] = {
				label: advancement.metadata.title,
				icon: advancement.metadata.icon,
				hint: advancement.metadata.hint,
				disabled: !advancement.availableForItem(this.item)
			};
		}
		context.types = BlackFlag.utils.sortObjectEntries(context.types, "label");
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(html) {
		super.activateListeners(html);
		html.on("change", "input", this._onChangeInput.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_onChangeInput(event) {
		const submit = this.element[0].querySelector("button[data-button='submit']");
		submit.disabled = !this.element[0].querySelector("input[name='type']:checked");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_onClickButton(event) {
		event.preventDefault();
		super._onClickButton(event);
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
	static async createDialog(item, { rejectClose=false, options={} }={}) {
		return new Promise((resolve, reject) => {
			const dialog = new this(item, {
				title: `${game.i18n.localize("BF.Advancement.Selection.Title")}: ${item.name}`,
				buttons: {
					submit: {
						callback: html => {
							const formData = new FormDataExtended(html.querySelector("form"));
							const type = formData.get("type");
							resolve(item.createEmbeddedDocuments("Advancement", [{ type }], { renderSheet: true }));
						}
					}
				},
				close: () => {
					if ( rejectClose ) reject("No advancement type was selected");
					else resolve(null);
				}
			}, foundry.utils.mergeObject(options, { jQuery: false }));
			dialog.render(true);
		});
	}
}
