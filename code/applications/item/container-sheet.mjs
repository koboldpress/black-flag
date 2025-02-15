import { numberFormat } from "../../utils/_module.mjs";
import InventoryElement from "../components/inventory.mjs";
import DragDrop from "../drag-drop.mjs";
import EquipmentSheet from "./equipment-sheet.mjs";

export default class ContainerSheet extends EquipmentSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "container", "equipment", "item", "sheet"],
			dragDrop: [{ dragSelector: null, dropSelector: "form" }],
			tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "contents" }],
			scrollY: ["[data-tab] > section"],
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * IDs for items on the sheet that have their descriptions expanded in-line.
	 * @type {Set<string>}
	 */
	expanded = new Set();

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.items = Array.from(await this.item.system.contents);
		context.itemContext = {};

		// TODO: Calculate capacity

		for (const item of context.items) {
			const ctx = (context.itemContext[item.id] ??= {});
			if (this.expanded.has(item.id)) ctx.expanded = await item.getSummaryContext({ secrets: this.item.isOwner });
			ctx.totalWeight = (await item.system.totalWeight).toNearest(0.1);
		}
		context.isContainer = true;

		await this.prepareItems(context);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the items for display on the sheet.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 * @abstract
	 */
	async prepareItems(context) {
		context.itemContext ??= {};
		context.sections = await InventoryElement.organizeItems(this.item, context.items, {
			callback: async (item, section) => {
				const itemContext = (context.itemContext[item.id] ??= {});
				const totalWeight = await item.system.totalWeight;
				itemContext.weight = totalWeight
					? numberFormat(totalWeight.toNearest(0.1), { unit: item.system.weight.units })
					: "—";
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _onDrop(event) {
		const { data } = DragDrop.getDragData(event);

		// Forward dropped items to the inventory element
		// TODO: Handle folders
		if (data.type === "Item") {
			InventoryElement.dropItems(event, this.item, [await Item.implementation.fromDropData(data)]);
			return;
		}

		return false;
	}
}
