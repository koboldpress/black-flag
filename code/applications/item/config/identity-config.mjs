import { slugify } from "../../../utils/_module.mjs";

/**
 * Application for viewing an item's ID & UUID and changing its identifier.
 */
export default class IdentifyConfig extends DocumentSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "identity"],
			template: "systems/black-flag/templates/item/config/identity-config.hbs",
			width: 400,
			height: "auto",
			sheetConfig: false,
			submitOnChange: true,
			submitOnClose: true,
			closeOnSubmit: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return `${game.i18n.localize("BF.Identity.Label")}: ${this.document.name}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options = {}) {
		const context = await super.getData(options);
		context.displayIdentifier = Object.hasOwn(context.document.system.identifier ?? {}, "value");
		context.identifierPlaceholder = slugify(context.document.name, { strict: true });
		return context;
	}
}
