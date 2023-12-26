import InventoryElement from "../components/inventory.mjs";
import EquipmentSheet from "./equipment-sheet.mjs";

export default class ContainerSheet extends EquipmentSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "container", "equipment", "item", "sheet"],
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "contents"}],
			scrollY: ["[data-tab] > section"],
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.items = Array.from(await this.item.system.contents);
		context.itemContext = {};

		// TODO: Calculate capacity

		for ( const item of context.items ) {
			const ctx = context.itemContext[item.id] ??= {};
			ctx.totalWeight = (await item.system.totalWeight).toNearest(0.1);
		}
		context.isContainer = true;

		context.sections = await InventoryElement.organizeItems(this.item, context.items);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */
}
