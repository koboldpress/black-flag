import AdvancementElement from "../components/advancement.mjs";
import BaseItemSheet from "./api/base-item-sheet.mjs";

/**
 * Item sheet responsible for displaying classes, subclasses, lineages, and heritages.
 */
export default class ConceptSheet extends BaseItemSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			deleteJournalLink: ConceptSheet.#deleteJournalLink
		},
		classes: ["concept"],
		position: {
			width: 810,
			height: 900
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static ENRICHED_FIELDS = {
		...super.ENRICHED_FIELDS,
		short: "system.description.short"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		header: {
			template: "systems/black-flag/templates/item/concept-summary.hbs"
		},
		tabs: {
			container: { classes: ["details"], id: "sheet-body" },
			template: "templates/generic/tab-navigation.hbs"
		},
		advancement: {
			container: { id: "sheet-body" },
			template: "systems/black-flag/templates/item/advancement.hbs",
			templates: ["systems/black-flag/templates/item/parts/advancement-section.hbs"],
			scrollable: [""]
		},
		description: {
			container: { id: "sheet-body" },
			template: "systems/black-flag/templates/item/description.hbs",
			scrollable: [""]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static TABS = [
		{ tab: "advancement", label: "BF.Sheet.Tab.Advancement" },
		{ tab: "description", label: "BF.Sheet.Tab.Description" }
	];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	tabGroups = {
		primary: "advancement"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareDescriptionContext(context, options) {
		context = await super._prepareDescriptionContext(context, options);
		context.hideSource = true;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing the journal link.
	 * @this {BaseItemSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #deleteJournalLink(event, target) {
		this.submit({ updateData: { "system.description.journal": "" } });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDrop(event) {
		event.preventDefault();
		const data = (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).getDragEventData(event);

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
