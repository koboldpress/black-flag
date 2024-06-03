/**
 * Pop out ProseMirror editor window for journal entries with multiple text areas that need editing.
 *
 * @param {JournalEntryPage} document - Journal entry page to be edited.
 * @param {object} options
 * @param {string} options.textKeyPath - The path to the specific HTML field being edited.
 */
export default class JournalEditor extends DocumentSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["journal-editor"],
			template: "systems/black-flag/templates/journal/journal-editor.hbs",
			width: 600,
			height: 640,
			resizable: true,
			sheetConfig: false,
			textKeyPath: null
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		if (this.options.title) return `${this.document.name}: ${this.options.title}`;
		else return this.document.name;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options = {}) {
		return foundry.utils.mergeObject(await super.getData(options), {
			enriched: await TextEditor.enrichHTML(foundry.utils.getProperty(this.document, this.options.textKeyPath) ?? "", {
				relativeTo: this.document,
				secrets: this.document.isOwner,
				async: true
			})
		});
	}
}
