import log from "../../utils/logging.mjs";

/**
 * Sheet class containing implementation shared across all actor types.
 */
export default class BaseActorSheet extends ActorSheet {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the sheet currently in editing mode?
	 * @type {boolean}
	 */
	editingMode = false;

	/* <><><><> <><><><> <><><><> <><><><> */

	get template() {
		return `systems/black-flag/templates/actor/${this.actor.type}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.CONFIG = CONFIG.BlackFlag;
		context.system = this.document.system;
		context.source = this.document.toObject().system;

		context.editingMode = this.editingMode;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		if ( this.options.editable && (game.user.isGM || this.actor.isOwner) ) {
			const closeIndex = buttons.findIndex(btn => btn.label === "Sheet");
			const getLabel = () => this.editingMode ? "BF.EditingMode.Editable" : "BF.EditingMode.Locked";
			const getIcon = () => `fa-solid fa-lock${this.editingMode ? "-open" : ""}`;
			buttons.splice(closeIndex, 0, {
				label: getLabel(),
				class: "toggle-editing-mode",
				icon: getIcon(),
				onclick: ev => {
					this.editingMode = !this.editingMode;
					ev.currentTarget.innerHTML = `<i class="${getIcon()}"></i> ${game.i18n.localize(getLabel())}`;
					this.render();
				}
			});
		}
		return buttons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", this._onAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a click on an action link.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async _onAction(event) {
		const { action, subAction, ...properties } = event.currentTarget.dataset;
		switch (action) {
			case "item":
				const item = this.actor.items.get(properties.itemId);
				switch (subAction) {
					case "delete":
						return item?.deleteDialog();
					case "edit":
					case "view":
						return item?.sheet.render(true);
				}
		}
		return log(`Unrecognized action: ${action}/${subAction}`, { level: "warn" });
	}
}
