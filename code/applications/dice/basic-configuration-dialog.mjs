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
export default class BasicRollConfigurationDialog extends FormApplication {
	constructor(config=[], message={}, options={}) {
		super(null, options);

		/**
		 * Roll configurations.
		 * @type {BasicRollProcessConfiguration[]}
		 */
		Object.defineProperty(this, "config", { value: config, writable: false, enumerable: true });

		this.message = message;
		this.object = this._buildRolls(foundry.utils.deepClone(this.config));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/dice/base-roll-dialog.hbs",
			title: "BF.Roll.Configuration.LabelGeneric",
			classes: ["black-flag", "dialog", "roll"],
			width: 400,
			submitOnChange: true,
			closeOnSubmit: false,
			jQuery: false,
			rollType: CONFIG.Dice.BasicRoll
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
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
	get rolls() {
		return this.object;
	}

	set rolls(rolls) {
		this.object = rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Buttons displayed in the configuration dialog.
	 * @returns {object}
	 * @protected
	 */
	_getButtons() {
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
			rollMode: this.message.rollMode ?? this.options.default?.rollMode,
			rollModes: CONFIG.Dice.rollModes,
			rollNotes: foundry.utils.deepClone(this.options.rollNotes ?? []),
			situational: this.rolls[0].data.situational,
			buttons: this._getButtons()
		}, super.getData(options));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Roll Handling            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a roll from the provided config.
	 * @param {BasicRollProcessConfiguration[]} config - Roll process configuration data.
	 * @param {object} [formData={}] - Data provided by the configuration form.
	 * @returns {BasicRoll[]}
	 * @internal
	 */
	_buildRolls(config, formData={}) {
		const RollType = this.options.rollType ?? CONFIG.Dice.BasicRoll;
		return config.rolls?.map((config, index) => RollType.create(this._buildConfig(config, formData, index))) ?? [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Type-specific roll configuration.
	 * @param {BasicRollConfiguration} config - Roll configuration data.
	 * @param {object} formData - Data provided by the configuration form.
	 * @param {number} index - Index of the roll within all rolls being prepared.
	 * @returns {BasicRollConfiguration}
	 * @protected
	 */
	_buildConfig(config, formData, index) {
		config = foundry.utils.mergeObject({parts: [], data: {}, options: {}}, config);

		/**
		 * A hook event that fires when a roll config is build within the roll prompt.
		 * @function blackFlag.buildRollConfig
		 * @memberof hookEvents
		 * @param {BasicRollConfigurationDialog} app - Roll configuration dialog.
		 * @param {BasicRollConfiguration} config - Roll configuration data.
		 * @param {object} formData - Any data entered into the rolling prompt.
		 * @param {number} index - Index of the roll within all rolls being prepared.
		 */
		Hooks.callAll("blackFlag.buildRollConfig", this, config, formData, index);

		if ( formData.situational && (config.situational !== false) ) {
			config.parts.push("@situational");
			config.data.situational = formData.situational;
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
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async close(options={}) {
		this.options.resolve?.([]);
		return super.close(options);
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
		if ( formData.rollMode ) this.message.rollMode = formData.rollMode;

		// If one of the buttons was clicked, finalize the roll, resolve the promise, and close
		if ( event.type === "submit" ) {
			const rolls = this._finalizeRolls(event.submitter?.dataset.action);
			this.options.resolve?.(rolls);
			this.close({ submit: false, force: true });
		}

		// Otherwise, re-build the in-memory rolls and re-render the dialog
		else {
			this.rolls = this._buildRolls(foundry.utils.deepClone(this.config), formData);
			this.render();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Static Constructor         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A helper constructor that displays the roll configuration dialog.
	 * @param {BasicRollProcessConfiguration} [config] - Initial roll configuration.
	 * @param {BasicRollDialogConfiguration} [dialog] - Configuration information for the dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Message configuration.
	 * @returns {Promise}
	 */
	static async configure(config={}, dialog={}, message={}) {
		return new Promise((resolve, reject) => {
			new this(config, message, { ...(dialog.options ?? {}), resolve, reject }).render(true);
		});
	}
}
