import BaseItemSheet from "./api/base-item-sheet.mjs";

/**
 * Item sheet responsible for displaying currency.
 */
export default class CurrencySheet extends BaseItemSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["currency"],
		position: {
			width: 600,
			height: 450
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareDescriptionContext(context, options) {
		context = await super._prepareDescriptionContext(context, options);
		context.descriptionParts = ["blackFlag.description-currency"];
		context.showSidebar = true;
		context.hidePrice = true;
		return context;
	}
}
