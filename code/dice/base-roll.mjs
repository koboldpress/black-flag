import BaseConfigurationDialog from "../applications/dice/base-configuration-dialog.mjs";

/**
 * Base roll configuration data.
 *
 * @typedef {object} BaseRollConfiguration
 * @property {string[]} [parts=[]] - Parts used to construct the roll formula.
 * @property {object} [data={}] - The roll data used to resolve the formula.
 * @property {Event} [event] - Event that triggered the roll.
 * @property {boolean} [extraTerms=true] - Whether extra terms added in the configuration dialog should be
 *                                         added to this roll.
 * @property {BaseRollOptions} [options] - Options passed through to the roll.
 */

/**
 * Options that describe a base roll.
 *
 * @typedef {object} BaseRollOptions
 * @property {number} [target] - The total roll result that must be met for the roll to be considered a success.
 */

/**
 * Message configuration data used when creating messages.
 *
 * @typedef {object} BaseMessageConfiguration
 * @property {boolean} [create=true] - Should a message be created when this roll is complete?
 * @property {string} [rollMode] - The roll mode to apply to this message from `CONFIG.Dice.rollModes`.
 * @property {PreCreateMessageCallback} [preCreate] - Message configuration callback.
 * @property {object} [data={}] - Additional data used when creating the message.
 */

/**
 * Method called after the rolls are completed but before the message is created for further message customization.
 *
 * @callback PreCreateMessageCallback
 * @param {BaseRoll[]} rolls - Rolls that have been executed.
 * @param {BaseMessageConfiguration} message - Message configuration information.
 */

/**
 * Data for the roll configuration dialog.
 *
 * @typedef {object} BaseDialogConfiguration
 * @property {boolean} [configure=true] - Should the roll configuration dialog be displayed?
 * @property {typeof BaseConfigurationDialog} - [applicationClass] - Alternate configuration dialog application to use.
 * @property {BaseConfigurationDialogOptions} [options] - Additional options passed through to the configuration dialog.
 */

/**
 * Dialog rendering options for roll configuration dialogs.
 *
 * @typedef {DialogOptions} BaseConfigurationDialogOptions
 * @property {object} default
 * @property {number} default.rollMode - The roll mode that is selected by default.
 * @property {typeof BaseRoll} rollType - Roll type to use when constructing final roll.
 * @property {Modifier[]} rollNotes - Notes to display with the roll.
 * @property {*} resolve - Method to call when resolving successfully.
 * @property {*} reject - Method to call when the dialog is closed or process fails.
 */

/**
 * Custom roll type that allows rolls in chat messages to be revived as the correct roll type.
 * @param {string} formula - The formula used to construct the roll.
 * @param {object} data - The roll data used to resolve the formula.
 * @param {object} options - Additional options that describe the roll.
 */
export default class BaseRoll extends Roll {
	/**
	 * Default application to use for configuring this roll.
	 * @type {typeof BaseConfigurationDialog}
	 */
	static DefaultConfigurationDialog = BaseConfigurationDialog;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Static Constructor         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a roll instance from the provided config.
	 * @param {BaseRollConfiguration} config - Roll configuration data.
	 * @returns {BaseRoll}
	 */
	static create(config) {
		const formula = (config.parts ?? []).join(" + ");
		return new this(formula, config.data, config.options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Construct and perform a Base Roll through the standard workflow.
	 * @param {BaseRollConfiguration|BaseRollConfiguration[]} [configs={}] - Roll configuration data.
	 * @param {BaseMessageConfiguration} [message={}] - Configuration data that guides roll message creation.
	 * @param {BaseDialogConfiguration} [dialog={}] - Data for the roll configuration dialog.
	 * @returns {BaseRoll[]} - Any rolls created.
	 */
	static async build(configs={}, message={}, dialog={}) {
		if ( foundry.utils.getType(configs) === "Object" ) configs = [configs];

		configs.forEach(c => this.applyKeybindings(c, dialog));

		let rolls;
		if ( dialog.configure !== false ) {
			let DialogClass = dialog.applicationClass ?? this.DefaultConfigurationDialog;
			try {
				rolls = await DialogClass.configure(configs, dialog);
			} catch(err) {
				if ( !err ) return;
				throw err;
			}
		} else {
			rolls = configs.map(config => this.create(config));
		}

		for ( const roll of rolls ) {
			await roll.evaluate({async: true});
		}

		if ( rolls?.length && (message.create !== false) ) {
			if ( foundry.utils.getType(message.preCreate) === "function" ) message.preCreate(rolls, message);
			await this.toMessage(rolls, message.data, { rollMode: rolls[0].options.rollMode ?? message.rollMode });
		}
		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determines whether the roll should be fast forwarded.
	 * @param {BaseRollConfiguration} config - Roll configuration data.
	 * @param {BaseDialogConfiguration} dialog - Data for the roll configuration dialog.
	 */
	static applyKeybindings(config, dialog) {
		dialog.configure ??= true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the result of this roll a failure? Returns `undefined` if roll isn't evaluated.
	 * @type {boolean|void}
	 */
	get isFailure() {
		if ( !this._evaluated ) return undefined;
		if ( !Number.isNumeric(this.options.target) ) return false;
		return this.total < this.options.target;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the result of this roll a success? Returns `undefined` if roll isn't evaluated.
	 * @type {boolean|void}
	 */
	get isSuccess() {
		if ( !this._evaluated ) return undefined;
		if ( !Number.isNumeric(this.options.target) ) return false;
		return this.total >= this.options.target;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Chat Messages            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Transform a Roll instance into a ChatMessage, displaying the roll result.
	 * This function can either create the ChatMessage directly, or return the data object that will be used to create.
	 *
	 * @param {BaseRoll[]} rolls - Rolls to add to the message.
	 * @param {object} messageData - The data object to use when creating the message
	 * @param {options} [options] - Additional options which modify the created message.
	 * @param {string} [options.rollMode] - The template roll mode to use for the message from CONFIG.Dice.rollModes
	 * @param {boolean} [options.create=true] - Whether to automatically create the chat message, or only return the
	 *                                          prepared chatData object.
	 * @returns {Promise<ChatMessage|object>} - A promise which resolves to the created ChatMessage document if create is
	 *                                         true, or the Object of prepared chatData otherwise.
	 */
	static async toMessage(rolls, messageData={}, {rollMode, create=true}={}) {
		for ( const roll of rolls ) {
			if ( !roll._evaluated ) await roll.evaluate({async: true});
		}

		// Prepare chat data
		messageData = foundry.utils.mergeObject({
			user: game.user.id,
			type: CONST.CHAT_MESSAGE_TYPES.ROLL,
			sound: CONFIG.sounds.dice
		}, messageData);
		messageData.rolls = rolls;

		// Either create the message or just return the chat data
		const cls = getDocumentClass("ChatMessage");
		const msg = new cls(messageData);

		// Either create or return the data
		if ( create ) return cls.create(msg.toObject(), { rollMode });
		else {
			if ( rollMode ) msg.applyRollMode(rollMode);
			return msg.toObject();
		}
	}
}
