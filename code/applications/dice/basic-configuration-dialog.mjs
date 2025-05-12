import BFApplication from "../api/application.mjs";

/**
 * Dialog rendering options for roll configuration dialogs.
 *
 * @typedef {DialogOptions} BasicRollConfigurationDialogOptions
 * @property {object} default
 * @property {number} default.rollMode - The roll mode that is selected by default.
 * @property {typeof BasicRoll} rollType - Roll type to use when constructing final roll.
 * @property {Modifier[]} rollNotes - Notes to display with the roll.
 */

/**
 * Roll configuration dialog.
 *
 * @param {BasicRollProcessConfiguration} [config={}] - Initial roll configurations.
 * @param {BasicRollMessageConfiguration} [message={}] - Message configuration.
 * @param {BasicRollConfigurationDialogOptions} [options={}] - Dialog rendering options.
 */
export default class BasicRollConfigurationDialog extends BFApplication {
	constructor(config = {}, message = {}, options = {}) {
		super(options);

		this.#config = config;
		this.#message = message;
		this.notes = this.options.rollNotes;
		this.#buildRolls(foundry.utils.deepClone(this.#config));
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
	 * @type {BasicRoll}
	 */
	static get rollType() {
		return CONFIG.Dice.BasicRoll;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll configuration.
	 * @type {BasicRollProcessConfiguration}
	 */
	#config;

	get config() {
		return this.#config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration information for the roll message.
	 * @type {BasicRollMessageConfiguration}
	 */
	#message;

	get message() {
		return this.#message;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll notes.
	 * @type {Modifier[]|void}
	 */
	notes;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The rolls being configured.
	 * @type {BasicRoll[]}
	 */
	#rolls;

	get rolls() {
		return this.#rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll type to use when constructing final roll.
	 * @type {BasicRoll}
	 */
	get rollType() {
		return this.options.rollType ?? this.constructor.rollType;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.config = this.config;
		context.message = this.message;
		context.notes = this.notes;
		context.options = this.options;
		return context;
	}

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
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareButtonsContext(context, options) {
		context.buttons = {
			roll: {
				icon: '<i class="fa-solid fa-dice" inert></i>',
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
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareConfigurationContext(context, options) {
		context.fields = [
			{
				field: new foundry.data.fields.StringField({
					label: game.i18n.localize("BF.Roll.Mode.Label"),
					required: true,
					blank: false
				}),
				name: "rollMode",
				options:
					game.release.generation < 13
						? Object.entries(CONFIG.Dice.rollModes).map(([value, l]) => ({ value, label: game.i18n.localize(l) }))
						: Object.entries(CONFIG.Dice.rollModes).map(([value, { label }]) => ({
								value,
								label: game.i18n.localize(label)
							})),
				value: this.message.rollMode ?? this.options.default?.rollMode
			}
		];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for the formulas list.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareFormulasContext(context, options) {
		context.rolls = this.rolls.map(roll => ({ roll }));
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for the roll notes.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareNotesContext(context, options) {
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
	 */
	#buildRolls(config, formData) {
		const RollType = this.rollType;
		this.#rolls =
			config.rolls?.map((config, index) =>
				RollType.fromConfig(this._buildConfig(config, formData, index), this.config)
			) ?? [];
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

		const situational = formData?.get(`roll.${index}.situational`);
		if (situational && config.situational !== false) {
			config.parts.push("@situational");
			config.data.situational = situational;
		} else {
			config.parts.findSplice(v => v === "@situational");
		}

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
		this._handleFormChanges(formData);
		this.#rolls = this._finalizeRolls(event.submitter?.dataset?.action);
		await this.close({ [game.system.id]: { submitted: true } });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle changes to form data.
	 * @param {FormDataExtended} formData - Data from the dialog.
	 * @protected
	 */
	_handleFormChanges(formData) {
		if (formData.has("rollMode")) this.message.rollMode = formData.get("rollMode");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);

		const formData = new (foundry.applications?.ux?.FormDataExtended ?? FormDataExtended)(this.element);
		this._handleFormChanges(formData);
		this.#buildRolls(foundry.utils.deepClone(this.config), formData);
		this.render({ parts: ["formulas", "notes"] });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_onClose(options = {}) {
		if (!options[game.system.id]?.submitted) this.#rolls = [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A helper constructor that displays the roll configuration dialog.
	 * @param {BasicRollProcessConfiguration} [config] - Initial roll configuration.
	 * @param {BasicRollDialogConfiguration} [dialog] - Configuration information for the dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Message configuration.
	 * @returns {Promise<BasicRoll[]>}
	 */
	static async configure(config = {}, dialog = {}, message = {}) {
		return new Promise((resolve, reject) => {
			const app = new this(config, message, dialog.options);
			app.addEventListener("close", () => resolve(app.rolls), { once: true });
			app.render({ force: true });
		});
	}
}
