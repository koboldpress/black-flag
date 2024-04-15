import IdentityConfig from "./config/identity-config.mjs";

/**
 * Sheet upon which all other item sheets are based.
 */
export default class BaseItemSheet extends ItemSheet {
	/**
	 * Fields that will be enriched during data preparation.
	 * @type {object}
	 */
	static enrichedFields = {
		description: "system.description.value"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.CONFIG = CONFIG.BlackFlag;
		context.system = this.document.system;
		context.source = this.document.toObject().system;

		const enrichmentContext = {
			secrets: this.item.isOwner,
			rollData: this.item.getRollData(),
			async: true,
			relativeTo: this.item
		};
		context.enriched = await Object.entries(this.constructor.enrichedFields).reduce(async (enriched, [key, path]) => {
			enriched[key] = await TextEditor.enrichHTML(foundry.utils.getProperty(context, path), enrichmentContext);
			return enriched;
		}, {});

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		if (this.options.editable && (game.user.isGM || this.item.isOwner))
			buttons.unshift({
				label: game.i18n.localize("BF.Identity.Label"),
				class: "identity-config",
				icon: "fa-solid fa-id-card",
				onclick: async ev => new IdentityConfig(this.item).render(true)
			});
		return buttons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll("[data-action]")) {
			element.addEventListener("click", this._onAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a click on an action link.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async _onAction(event) {}
}
