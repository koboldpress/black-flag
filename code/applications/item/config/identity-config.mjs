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
		context.displayIdentifier = Object.hasOwn(context.document.system, "identifier");
		context.identifierPlaceholder = slugify(context.document.name);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll('[data-action="copy"]')) {
			element.addEventListener("click", this._onCopy.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Copy a value from a field.
	 * @param {PointerEvent} event - Triggering click event.
	 */
	_onCopy(event) {
		const field = event.target.closest(".form-fields").querySelector("input");
		const value = field?.value || field?.placeholder;
		if (!value) return;
		game.clipboard.copyPlainText(value);
		game.tooltip.activate(field, {
			text: game.i18n.format("BF.Identity.Copied", { value }),
			direction: "UP"
		});
	}
}
