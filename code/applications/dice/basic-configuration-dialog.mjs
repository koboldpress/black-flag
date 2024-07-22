import BFApplication from "../api/application.mjs";

/**
 * Dialog rendering options for roll configuration dialogs.
 *
 * @typedef {DialogOptions} BasicRollConfigurationDialogOptions
 * @property {object} default
 * @property {number} default.rollMode - The roll mode that is selected by default.
 * @property {typeof BasicRoll} rollType - Roll type to use when constructing final roll.
 * @property {Modifier[]} rollNotes - Notes to display with the roll.
 * @property {*} resolve - Method to call when resolving successfully.
 * @property {*} reject - Method to call when the dialog is closed or process fails.
 */

/**
 * Roll configuration dialog.
 *
 * @param {BasicRollProcessConfiguration} [config=[]] - Initial roll configurations.
 * @param {BasicRollMessageConfiguration} [message={}] - Message configuration.
 * @param {BasicRollConfigurationDialogOptions} [options={}] - Dialog rendering options.
 */
export default class BasicRollConfigurationDialog extends BFApplication {
	constructor(config = [], message = {}, options = {}) {
		super(options);

		/**
		 * Roll configurations.
		 * @type {BasicRollProcessConfiguration[]}
		 */
		Object.defineProperty(this, "config", { value: config, writable: false, enumerable: true });

		this.notes = this.options.rollNotes;
		this.message = message;
		this.rolls = this.#buildRolls(foundry.utils.deepClone(this.config));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["roll-configuration", "form-list"],
		tag: "form",
		window: {
			title: "BF.Roll.Configuration.LabelGeneric",
			icon: "fa-solid fa-dice",
			minimizable: false
		},
		form: {
			handler: BasicRollConfigurationDialog.#handleFormSubmission
		},
		position: {
			width: 450
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		formulas: {
			template: "systems/black-flag/templates/dice/base-formulas.hbs"
		},
		configuration: {
			template: "systems/black-flag/templates/dice/base-configuration.hbs"
		},
		notes: {
			template: "systems/black-flag/templates/dice/base-roll-notes.hbs"
		},
		buttons: {
			template: "systems/black-flag/templates/dice/base-buttons.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll type to use when constructing final roll.
	 * @type {BaseRoll}
	 */
	static get rollType() {
		return CONFIG.Dice.BaseRoll;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll notes.
	 * @type {Modifier[]|void}
	 */
	notes;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration information for the roll message.
	 * @type {BasicRollMessageConfiguration}
	 */
	message;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The rolls being configured.
	 * @type {BasicRoll[]}
	 */
	rolls;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll type to use when constructing final roll.
	 * @type {BaseRoll}
	 */
	get rollType() {
		return this.options.rollType ?? this.constructor.rollType;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "buttons":
				return this._prepareButtonsContext(context, options);
			case "configuration":
				return this._prepareConfigurationContext(context, options);
			case "formulas":
				return this._prepareFormulasContext(context, options);
			case "notes":
				return this._prepareNotesContext(context, options);
			default:
				return context;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for the buttons.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	_prepareButtonsContext(context, options) {
		context.buttons = {
			roll: {
				icon: '<i class="fa-solid fa-dice"></i>',
				label: game.i18n.localize("BF.Roll.Action.RollGeneric")
			}
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for the roll configuration section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	_prepareConfigurationContext(context, options) {
		context.rollMode = this.message.rollMode ?? this.options.default?.rollMode;
		context.rollModesOptions = CONFIG.Dice.rollModes;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for the formulas list.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	_prepareFormulasContext(context, options) {
		context.rolls = this.rolls;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for the roll notes.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	_prepareNotesContext(context, options) {
		context.notes = foundry.utils.deepClone(this.notes ?? []);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Roll Handling            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a roll from the provided config.
	 * @param {BasicRollProcessConfiguration[]} config - Roll process configuration data.
	 * @param {FormDataExtended} [formData] - Data provided by the configuration form.
	 * @returns {BasicRoll[]}
	 * @private
	 */
	#buildRolls(config, formData) {
		const RollType = this.rollType;
		return config.rolls?.map((config, index) => RollType.create(this._buildConfig(config, formData, index))) ?? [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Type-specific roll configuration.
	 * @param {BasicRollConfiguration} config - Roll configuration data.
	 * @param {FormDataExtended} formData - Data provided by the configuration form.
	 * @param {number} index - Index of the roll within all rolls being prepared.
	 * @returns {BasicRollConfiguration}
	 * @protected
	 */
	_buildConfig(config, formData, index) {
		config = foundry.utils.mergeObject({ parts: [], data: {}, options: {} }, config);

		/**
		 * A hook event that fires when a roll config is build within the roll prompt.
		 * @function blackFlag.buildRollConfig
		 * @memberof hookEvents
		 * @param {BasicRollConfigurationDialog} app - Roll configuration dialog.
		 * @param {BasicRollConfiguration} config - Roll configuration data.
		 * @param {object} data
		 * @param {FormDataExtended} data.formData - Any data entered into the rolling prompt.
		 * @param {number} data.index - Index of the roll within all rolls being prepared.
		 */
		Hooks.callAll("blackFlag.buildRollConfig", this, config, { formData, index });

		// TODO: Handle situational bonuses on a per-formula basis
		// if (formData.get("situational") && config.situational !== false) {
		// 	config.parts.push("@situational");
		// 	config.data.situational = formData.situational;
		// }

		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Final roll preparation based on the pressed button.
	 * @param {string} action - That button that was pressed.
	 * @returns {BasicRoll[]}
	 * @protected
	 */
	_finalizeRolls(action) {
		return this.rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Rebuild rolls based on an updated config and re-render the dialog.
	 */
	rebuild() {
		this._onChangeForm(this.options.form, new Event("change"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle submission of the dialog using the form buttons.
	 * @param {Event|SubmitEvent} event - The form submission event.
	 * @param {HTMLFormElement} form - The submitted form.
	 * @param {FormDataExtended} formData - Data from the dialog.
	 * @private
	 */
	static async #handleFormSubmission(event, form, formData) {
		const rolls = this._finalizeRolls(event.submitter?.dataset?.action);
		await this.close({ [game.system.id]: { rolls } });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);

		const formData = new FormDataExtended(this.element);
		if (formData.has("rollMode")) this.message.rollMode = formData.get("rollMode");
		this.rolls = this.#buildRolls(foundry.utils.deepClone(this.config), formData);
		this.render({ parts: ["formulas", "notes"] });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_onClose(options = {}) {
		this.options.resolve?.(options[game.system.id]?.rolls ?? []);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A helper constructor that displays the roll configuration dialog.
	 * @param {BasicRollProcessConfiguration} [config] - Initial roll configuration.
	 * @param {BasicRollDialogConfiguration} [dialog] - Configuration information for the dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Message configuration.
	 * @returns {Promise<BaseRoll[]>}
	 */
	static async configure(config = {}, dialog = {}, message = {}) {
		return new Promise((resolve, reject) => {
			new this(config, message, { ...(dialog.options ?? {}), resolve, reject }).render(true);
		});
	}
}
