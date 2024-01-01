/**
 * Presents a list of activity types to create when clicking the new activity button.
 *
 * @param {BlackFlagItem} item - Item to which this activity will be added.
 * @param {object} [dialogData={}] - An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}] - Dialog rendering options.
 */
export default class ActivitySelection extends Dialog {
	constructor(item, dialogData={}, options={}) {
		super(dialogData, options);
		this.item = item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The Item to which this Activity is being added.
	 * @type {BlackFlagItem}
	 */
	item;

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "dialog", "pseudo-document-selection"],
			template: "systems/black-flag/templates/pseudo-document-selection.hbs",
			title: "BF.Activity.Selection.Title",
			width: 500,
			height: "auto"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get id() {
		return `item-${this.item.id}-activity-selection`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData() {
		const context = { types: {} };
		for ( const [name, config] of Object.entries(CONFIG.Activity.types) ) {
			if ( name === CONST.BASE_DOCUMENT_TYPE ) continue;
			const activity = config.documentClass;
			context.types[name] = {
				label: game.i18n.localize(activity.metadata.title),
				icon: activity.metadata.icon,
				hint: game.i18n.localize(activity.metadata.hint)
			};
		}
		context.types = BlackFlag.utils.sortObjectEntries(context.types, { sortKey: "label" });
		context.buttonLabel = game.i18n.localize("BF.Activity.Core.Action.Create");
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

	/**
	 * A helper constructor function which displays the selection dialog and returns a Promise once its workflow has
	 * been resolved.
	 * @param {BlackFlagItem} item - Item to which the activity should be added.
	 * @param {object} [config={}]
	 * @param {boolean} [config.rejectClose=false] - Trigger a rejection if the window was closed without a choice.
	 * @param {object} [config.options={}] - Additional rendering options passed to the Dialog.
	 * @returns {Promise<ActivityConfig|null>}
	 */
	static async createDialog(item, { rejectClose=false, options={} }={}) {
		return new Promise((resolve, reject) => {
			const dialog = new this(item, {
				title: `${game.i18n.localize("BF.Activity.Selection.Title")}: ${item.name}`,
				buttons: {
					submit: {
						callback: html => {
							const formData = new FormDataExtended(html.querySelector("form"));
							const type = formData.get("type");
							resolve(item.createEmbeddedDocuments("Activity", [{ type }], { renderSheet: true }));
						}
					}
				},
				close: () => {
					if ( rejectClose ) reject("No activity type was selected");
					else resolve(null);
				}
			}, foundry.utils.mergeObject(options, { jQuery: false }));
			dialog.render(true);
		});
	}
}
