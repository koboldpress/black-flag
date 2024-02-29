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
 * @param {BasicRollConfiguration[]} [rollConfig=[]] - Initial roll configurations.
 * @param {BasicRollConfigurationDialogOptions} [options={}] - Dialog rendering options.
 */
export default class BaseConfigurationDialog extends FormApplication {
	constructor(rollConfig=[], options={}) {
		super(null, options);

		/**
		 * Roll configurations.
		 * @type {BasicRollConfiguration[]}
		 */
		Object.defineProperty(this, "rollConfig", { value: rollConfig, writable: false, enumerable: true });

		this.object = this._buildRolls(foundry.utils.deepClone(this.rollConfig));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/dice/base-roll-dialog.hbs",
			classes: ["black-flag", "dialog", "roll"],
			width: 400,
			submitOnChange: true,
			closeOnSubmit: false,
			jQuery: false,
			rollType: CONFIG.Dice.BasicRoll
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The rolls being configured.
	 * @type {BasicRoll[]}
	 */
	get rolls() {
		return this.object;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return this.options.title || game.i18n.localize("BF.Roll.Configuration.LabelGeneric");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Static Constructor         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A helper constructor that displays the roll configuration dialog.
	 * @param {BasicRollConfiguration[]} [rollConfig] - Initial roll configuration.
	 * @param {BasicRollDialogConfiguration} [options] - Configuration information for the dialog.
	 * @returns {Promise}
	 */
	static async configure(rollConfig=[], options={}) {
		return new Promise((resolve, reject) => {
			new this(
				rollConfig,
				foundry.utils.mergeObject({ resolve, reject }, options.options)
			).render(true);
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Buttons displayed in the configuration dialog.
	 * @returns {object}
	 * @protected
	 */
	getButtons() {
		return {
			roll: {
				label: game.i18n.localize("BF.Roll.Action.RollGeneric")
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options={}) {
		return foundry.utils.mergeObject({
			CONFIG: CONFIG.BlackFlag,
			default: this.options.default ?? {},
			rolls: this.rolls,
			rollModes: CONFIG.Dice.rollModes,
			rollNotes: foundry.utils.deepClone(this.options.rollNotes ?? []),
			situational: this.rolls[0].data.situational,
			buttons: this.getButtons()
		}, super.getData(options));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];
		for ( const button of html.querySelectorAll("button[data-action]") ) {
			button.addEventListener("click", this._onButtonAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async close(options={}) {
		this.options.reject?.();
		return super.close(options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Final roll preparation based on the pressed button.
	 * @param {string} action - That button that was pressed.
	 * @returns {BasicRoll[]}
	 */
	finalizeRolls(action) {
		return this.rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	submit(button, event) {
		event?.preventDefault();
		super.submit(button, event);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Type-specific roll configuration.
	 * @param {BasicRollConfiguration} config - Roll configuration data.
	 * @param {object} formData - Data provided by the configuration form.
	 * @returns {BasicRollConfiguration}
	 */
	buildConfig(config, formData) {
		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare individual config in order to build rolls.
	 * @param {BasicRollConfiguration} config - Roll configuration data.
	 * @param {object} formData - Data provided by the configuration form.
	 * @returns {BasicRollConfiguration}
	 */
	_prepareConfig(config, formData) {
		config = foundry.utils.mergeObject({parts: [], data: {}, options: {}}, config);
		if ( this.buildConfig ) config = this.buildConfig(config, formData);

		if ( formData.situational && (config.extraTerms !== false) ) {
			config.parts.push("@situational");
			config.data.situational = formData.situational;
		}

		if ( formData.rollMode ) {
			config.options.rollMode = formData.rollMode;
		}

		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a roll from the provided config.
	 * @param {BasicRollConfiguration[]} configs - Roll configuration data.
	 * @param {object} [formData={}] - Data provided by the configuration form.
	 * @returns {BasicRoll[]}
	 */
	_buildRolls(configs, formData={}) {
		const RollType = this.options.rollType ?? Roll;
		return configs.map(c => RollType.create(this._prepareConfig(c, formData)));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicks to the buttons.
	 * @param {HTMLEvent} event - Triggering click event.
	 */
	_onButtonAction(event) {
		const rolls = this.finalizeRolls(event.currentTarget.dataset.action);
		this.options.resolve?.(rolls);
		this.close({submit: false, force: true});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_updateObject(event, formData) {
		this.object = this._buildRolls(foundry.utils.deepClone(this.rollConfig), formData);
		this.render();
	}
}
