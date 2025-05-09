import { numberFormat } from "../../utils/_module.mjs";
import InventoryElement from "../components/inventory.mjs";
import EquipmentSheet from "./equipment-sheet.mjs";

/**
 * Item sheet responsible for displaying containers.
 */
export default class ContainerSheet extends EquipmentSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["container"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		...super.PARTS,
		contents: {
			container: { id: "sheet-body" },
			template: "systems/black-flag/templates/item/contents.hbs",
			scrollable: [""]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static TABS = [{ tab: "contents", label: "BF.Sheet.Tab.Contents" }, ...super.TABS];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	tabGroups = {
		primary: "contents"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * IDs for items on the sheet that have their descriptions expanded in-line.
	 * @type {Set<string>}
	 */
	expanded = new Set();
	// TODO: Replace this with expandedSections

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "contents":
				context = await this._prepareContentsContext(context, options);
				break;
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the contents tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareContentsContext(context, options) {
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

	/** @inheritDoc */
	async _prepareDescriptionContext(context, options) {
		context = await super._prepareDescriptionContext(context, options);
		context.descriptionParts = [];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareDetailsContext(context, options) {
		context = await super._prepareDetailsContext(context, options);
		context.detailsParts = ["blackFlag.details-container"];
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
		const { data } = CONFIG.ux.DragDrop.getDragData(event);

		// Forward dropped items to the inventory element
		// TODO: Handle folders
		if (data.type === "Item") {
			InventoryElement.dropItems(event, this.item, [await Item.implementation.fromDropData(data)]);
			return;
		}

		return false;
	}
}
