import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for property advancement.
 */
export default class PropertyConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["property", "form-list"],
		actions: {
			addChange: PropertyConfig.#onAddChange,
			deleteChange: PropertyConfig.#onDeleteChange
		},
		position: {
			width: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/advancement-controls-section.hbs"
		},
		changes: {
			template: "systems/black-flag/templates/advancement/property-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
			obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle adding a change to the list.
	 * @this {AdvancementConfig}
	 * @param {Event} event - The originating click event.
	 * @param {HTMLElement} target - The button that was clicked.
	 * @returns {Promise<BlackFlagItem>} - The updated parent Item after the application re-renders.
	 */
	static async #onAddChange(event, target) {
		const idx = this.advancement.configuration.changes.length;
		return this.submit({ updateData: { [`configuration.changes.${idx}`]: {} } });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle deleting a change to the list.
	 * @this {AdvancementConfig}
	 * @param {Event} event - The originating click event.
	 * @param {HTMLElement} target - The button that was clicked.
	 * @returns {Promise<BlackFlagItem>} - The updated parent Item after the application re-renders.
	 */
	static async #onDeleteChange(event, target) {
		event.target.closest(".effect-change").remove();
		return this.submit();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareConfigurationUpdate(configuration) {
		configuration.changes = Object.values(configuration.changes ?? []);
		return configuration;
	}
}
