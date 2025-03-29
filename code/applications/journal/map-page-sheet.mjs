/**
 * Journal entry page to display a special map marker.
 */
export default class MapLocationPageSheet extends foundry.appv1.sheets.JournalTextPageSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes.push("black-flag", "map");
		return options;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get template() {
		return `templates/journal/page-text-${this.isEditable ? "edit" : "view"}.html`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _renderInner(...args) {
		const jQuery = await super._renderInner(...args);
		const editingHeader = jQuery[0].querySelector(".journal-header");
		const viewingHeader = jQuery[0].querySelector(":is(h1, h2, h3)");

		if (editingHeader) {
			const input = document.createElement("input");
			input.name = "system.code";
			input.type = "text";
			input.value = this.document.system.code ?? "";
			editingHeader.insertAdjacentElement("afterbegin", input);
		} else if (viewingHeader && this.document.system.code) {
			viewingHeader.dataset.mapLocationCode = this.document.system.code;
		}

		return jQuery;
	}
}
