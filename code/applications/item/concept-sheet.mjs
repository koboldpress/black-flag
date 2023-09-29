import AdvancementItemSheet from "./advancement-item-sheet.mjs";

export default class ConceptSheet extends AdvancementItemSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "concept", "item", "sheet"],
			dragDrop: [{ dropSelector: ".drop-target" }],
			template: "systems/black-flag/templates/item/concept.hbs",
			width: 810,
			height: 900
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _onAction(event) {
		const { action } = event.currentTarget.dataset;
		switch (action) {
			case "journal-link":
				return await this.document.update({"system.description.journal": ""});
		}
		return super._onAction(event);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDrop(event) {
		event.preventDefault();
		const data = TextEditor.getDragEventData(event);
		if ( !["JournalEntry", "JournalEntryPage"].includes(data.type) || !data.uuid ) return super._onDrop(event);

		await this.document.update({"system.description.journal": data.uuid});
	}
}
