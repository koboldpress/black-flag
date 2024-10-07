import AdvancementElement from "../components/advancement.mjs";
import BaseItemSheet from "./base-item-sheet.mjs";

export default class ConceptSheet extends BaseItemSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "concept", "item", "sheet"],
			dragDrop: [{ dropSelector: "form" }],
			tabs: [
				{
					group: "primary",
					navSelector: 'nav[data-group="primary"]',
					contentSelector: ".tab-area",
					initial: "advancement"
				}
			],
			template: "systems/black-flag/templates/item/concept.hbs",
			width: 810,
			height: 900
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static enrichedFields = foundry.utils.mergeObject(
		super.enrichedFields,
		{
			short: "system.description.short"
		},
		{ inplace: false }
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		context.advancement = AdvancementElement.prepareContext(this.item.system.advancement);
		context.showClassSelector = context.editable && this.item.type === "subclass";
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onAction(event) {
		const { action } = event.currentTarget.dataset;
		switch (action) {
			case "journal-link":
				return await this.submit({ updateData: { "system.description.journal": "" } });
		}
		return super._onAction(event);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDrop(event) {
		event.preventDefault();
		const data = TextEditor.getDragEventData(event);

		switch (data.type) {
			case "Advancement":
				const advancement = (await fromUuid(data.uuid)).toObject() ?? data.data;
				return AdvancementElement.dropAdvancement(event, this.item, [advancement]);
			case "Item":
				const item = await Item.implementation.fromDropData(data);
				return AdvancementElement.dropItems(event, this.item, [item]);
			case "JournalEntry":
			case "JournalEntryPage":
				if (data.uuid) return await this.submit({ updateData: { "system.description.journal": data.uuid } });
		}

		return super._onDrop(event);
	}
}
