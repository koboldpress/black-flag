import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for property advancement.
 */
export default class PropertyConfig extends AdvancementConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "property"],
			template: "systems/black-flag/templates/advancement/property-config.hbs",
			width: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options) {
		const context = super.getData(options);
		context.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
			obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];
		for ( const element of html.querySelectorAll(".effect-control") ) {
			element.addEventListener("click", this._onEffectControl.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicks on any effect controls.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {void}
	 */
	_onEffectControl(event) {
		event.preventDefault();
		const action = event.currentTarget.dataset.action;
		switch ( action ) {
			case "add":
				const idx = this.advancement.configuration.changes.length;
				return this.submit({updateData: { [`configuration.changes.${idx}`]: {} }});
			case "delete":
				event.target.closest(".effect-change").remove();
				return this.submit();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareConfigurationUpdate(configuration) {
		configuration.changes = Object.values(configuration.changes ?? {});
		return configuration;
	}
}
