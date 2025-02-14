import BaseConfigSheet from "./base-config-sheet.mjs";

/**
 * Config sheet that allows for selecting a key used for abilities, skills, and tools.
 */
export default class BaseSelectorConfigSheet extends BaseConfigSheet {
	constructor(options) {
		super(options);
		this.selectedId = this.options.selectedId ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		selector: {
			template: "systems/black-flag/templates/actor/config/id-selector.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The ability being modified by this app.
	 * @type {string|null}
	 */
	selectedId;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "selector":
				return this._prepareSelectorContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the ID selector section.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareSelectorContext(context, options) {
		context.options = [{ value: "", label: game.i18n.localize("BF.Global") }, { rule: true }];
		context.selected = this.selectedId;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);
		if (event.target.name === "selectedId") {
			this.selectedId = event.target.value;
			this.render();
		}
	}
}
