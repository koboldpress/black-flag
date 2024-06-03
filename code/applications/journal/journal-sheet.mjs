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

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getPageData() {
		const pageData = super._getPageData();

		let adjustment = 0;
		for (const page of pageData) {
			const pageDocument = this.document.pages.get(page._id);
			let needsAdjustment = true;
			const numbering = pageDocument.system.adjustTOCNumbering?.(page.number);
			if (numbering) {
				page.number = numbering.number;
				adjustment += numbering.adjustment ?? 0;
				needsAdjustment = false;
			}
			if (needsAdjustment) page.number += adjustment;
		}

		return pageData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

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
