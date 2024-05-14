/**
 * Variant of the standard journal sheet to handle custom TOC numbering.
 */
export default class BlackFlagJournalSheet extends JournalSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes.push("black-flag-journal");
		return options;
	}

	/* -------------------------------------------- */

	/**
	 * Add Black Flag class to individual journal pages.
	 * @param {JournalPageSheet} page - The journal page application.
	 * @param {jQuery} jQuery - The rendered Application HTML.
	 * @param {object} context - Rendering context provided.
	 */
	static onRenderJournalPageSheet(page, jQuery, context) {
		if (page.object.parent.sheet instanceof BlackFlagJournalSheet) {
			let element;
			if (context.editable) element = jQuery[0];
			else element = jQuery[0].parentElement;
			element?.classList.add("black-flag-journal");
		}
	}
}
