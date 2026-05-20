import BasicRollConfigurationDialog from "../applications/dice/basic-configuration-dialog.mjs";
import { buildRoll } from "../utils/_module.mjs";

/**
 * Configuration data for the process of rolling a basic roll.
 *
 * @typedef {object} BasicRollProcessConfiguration
 * @property {BasicRollConfiguration[]} rolls - Configuration data for individual rolls.
 * @property {boolean} [evaluate=true] - Should the rolls be evaluated? If set to `false`, then no chat message
 *                                       will be created regardless of message configuration.
 * @property {Event} [event] - Event that triggered the rolling process.
 * @property {string[]} [hookNames] - Name suffixes for configuration hooks called.
 * @property {Document|PseudoDocument} [subject] - Source of the roll.
 * @property {number} [target] - Default target value for all rolls.
 */

/**
 * Base roll configuration data.
 *
 * @typedef {object} BasicRollConfiguration
 * @property {string[]} [parts=[]] - Parts used to construct the roll formula.
 * @property {object} [data={}] - The roll data used to resolve the formula.
 * @property {boolean} [situational=true] - Whether a situational bonus can be added to this roll in the roll prompt.
 * @property {BasicRollOptions} [options] - Options passed through to the roll.
 */

/**
 * Options that describe a base roll.
 *
 * @typedef {object} BasicRollOptions
 * @property {number} [target] - The total roll result that must be met for the roll to be considered a success.
 */

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Data for the roll configuration dialog.
 *
 * @typedef {object} BasicRollDialogConfiguration
 * @property {boolean} [configure=true] - Should the roll configuration dialog be displayed?
 * @property {typeof BaseConfigurationDialog} - [applicationClass] - Alternate configuration dialog application to use.
 * @property {BaseConfigurationDialogOptions} [options] - Additional options passed through to the configuration dialog.
 * @property {ApplicationV2} [sheet] - Sheet to render the dialog as a child of.
 */

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Message configuration data used when creating messages.
 *
 * @typedef {object} BasicRollMessageConfiguration
 * @property {boolean} [create=true] - Should a message be created when this roll is complete?
 * @property {object} [data={}] - Additional data used when creating the message.
 * @property {BlackFlagChatMessage} [document] - Final created chat message document once process is completed.
 * @property {PreCreateRollMessageCallback} [preCreate] - Message configuration callback.
 * @property {string} [rollMode] - The roll mode to apply to this message from `CONFIG.ChatMessage.modes`.
 */

/**
 * Method called after the rolls are completed but before the message is created for further message customization.
 *
 * @callback PreCreateRollMessageCallback
 * @param {BasicRoll[]} rolls - Rolls that have been executed.
 * @param {BasicRollProcessConfiguration} config - Roll process configuration information.
 * @param {BasicRollMessageConfiguration} message - Message configuration information.
 */

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Custom roll type that allows rolls in chat messages to be revived as the correct roll type.
 * @param {string} formula - The formula used to construct the roll.
 * @param {object} data - The roll data used to resolve the formula.
 * @param {BasicRollOptions} options - Additional options that describe the roll.
 */
export default class BasicRoll extends Roll {
	/**
	 * Default application to use for configuring this roll.
	 * @type {typeof RollConfigurationDialog}
	 */
	static DefaultConfigurationDialog = BasicRollConfigurationDialog;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Static Construction         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a roll instance from the provided config.
	 * @param {BasicRollConfiguration} config - Roll configuration data.
	 * @param {BasicRollProcessConfiguration} [process={}] - Process configuration data.
	 * @returns {BasicRoll}
	 */
	static fromConfig(config, process = {}) {
		const formula = (config.parts ?? []).join(" + ");
		config.options ??= {};
		config.options.target ??= process.target;
		return new this(formula, config.data, config.options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Construct roll parts and populate its data object.
	 * @param {object} parts - Information on the parts to be constructed.
	 * @param {object} [data] - Roll data to use and populate while constructing the parts.
	 * @returns {{ parts: string[], data: object }}
	 */
	static constructParts(parts, data = {}) {
		return buildRoll(parts, data);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Construct and perform a Base Roll through the standard workflow.
	 * @param {BasicRollProcessConfiguration} [config={}] - Roll configuration data.
	 * @param {BasicRollDialogConfiguration} [dialog={}] - Data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message={}] - Configuration data that guides roll message creation.
	 * @returns {BasicRoll[]} - Any rolls created.
	 */
	static async build(config = {}, dialog = {}, message = {}) {
		const rolls = await this.buildConfigure(config, dialog, message);
		await this.buildEvaluate(rolls, config, message);
		await this.buildPost(rolls, config, message);
		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Stage one of the standard rolling workflow, configuring the roll.
	 * @param {BasicRollProcessConfiguration} [config={}] - Configuration for the rolls.
	 * @param {BasicRollDialogConfiguration} [dialog={}] - Configuration for roll prompt.
	 * @param {BasicRollMessageConfiguration} [message={}] - Configuration for message creation.
	 * @returns {BasicRoll[]}
	 */
	static async buildConfigure(config = {}, dialog = {}, message = {}) {
		config.hookNames = [...(config.hookNames ?? []), ""];

		/**
		 * A hook event that fires before a roll is performed. Multiple hooks may be called depending on the rolling
		 * method (e.g. `blackFlag.preRollSkill`, `blackFlag.preRollAbilityCheck`, `blackFlag.preRoll`). Exact contents
		 * of the configuration object will also change based on the roll type, but the same objects will always be present.
		 * @function blackFlag.preRoll
		 * @memberof hookEvents
		 * @param {BasicRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		for (const hookName of config.hookNames) {
			if (Hooks.call(`blackFlag.preRoll${hookName.capitalize()}`, config, dialog, message) === false) return [];
		}

		this.applyKeybindings(config, dialog, message);
		dialog.sheet ??= foundry.applications.instances.get(config.event?.target?.closest(".application")?.id);

		let rolls;
		if (dialog.configure === false) {
			rolls =
				config.rolls?.map((c, index) => {
					// TODO: Re-implement after dnd5e design
					// dialog.options?.buildConfig?.(config, c, null, index);
					for (const hookName of config.hookNames) {
						Hooks.callAll(`blackFlag.postBuild${hookName.capitalize()}RollConfig`, config, c, index);
					}
					return this.fromConfig(c, config);
				}) ?? [];
		} else {
			const DialogClass = dialog.applicationClass ?? this.DefaultConfigurationDialog;
			rolls = await DialogClass.configure(config, dialog, message);
		}

		/**
		 * A hook event that fires after roll configuration is complete, but before the roll is evaluated.
		 * Multiple hooks may be called depending on the rolling method (e.g. `dnd5e.postSkillCheckRollConfiguration`,
		 * `blackFlag.postAbilityTestRollConfiguration`, and `blackFlag.postRollConfiguration` for skill checks). Exact
		 * contents of the configuration object will also change based on the roll type, but the same objects will always
		 * be present.
		 * @function blackFlag.postRollConfiguration
		 * @memberof hookEvents
		 * @param {BasicRoll[]} rolls - Rolls that have been constructed but not evaluated.
		 * @param {BasicRollProcessConfiguration} config - Configuration information for the roll.
		 * @param {BasicRollDialogConfiguration} dialog - Configuration for the roll dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration for the roll message.
		 * @returns {boolean} - Explicitly return `false` to prevent rolls.
		 */
		for (const hookName of config.hookNames) {
			const name = `blackFlag.post${hookName.capitalize()}RollConfiguration`;
			if (Hooks.call(name, rolls, config, dialog, message) === false) return [];
		}

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Stage two of the standard rolling workflow, evaluating the rolls.
	 * @param {BasicRoll[]} rolls - Rolls to evaluate.
	 * @param {BasicRollProcessConfiguration} [config={}] - Configuration for the rolls.
	 * @param {BasicRollMessageConfiguration} [message={}] - Configuration for message creation.
	 */
	static async buildEvaluate(rolls, config = {}, message = {}) {
		if (config.evaluate !== false) {
			for (const roll of rolls) await roll.evaluate();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Stage three of the standard rolling workflow, posting a message to chat.
	 * @param {BasicRoll[]} rolls - Rolls to evaluate.
	 * @param {BasicRollProcessConfiguration} config - Configuration for the rolls.
	 * @param {BasicRollMessageConfiguration} message - Configuration for message creation.
	 * @returns {BlackFlagChatMessage|void}
	 */
	static async buildPost(rolls, config, message) {
		message = foundry.utils.expandObject(message ?? {});
		const messageId = config.event?.target.closest("[data-message-id]")?.dataset.messageId;
		if (messageId) foundry.utils.setProperty(message, `data.flags.${game.system.id}.originatingMessage`, messageId);

		if (rolls?.length && config.evaluate !== false) {
			if (foundry.utils.getType(message.preCreate) === "function") message.preCreate(rolls, config, message);
			message[message.create !== false ? "document" : "data"] = await this.toMessage(rolls, message.data, {
				create: message.create,
				rollMode: message.rollMode
			});
			if (message.document) rolls.forEach(r => (r.parent = message.document));
		}

		return message.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determines whether the roll should be fast forwarded.
	 * @param {BasicRollProcessConfiguration} config - Roll configuration data.
	 * @param {BasicRollDialogConfiguration} dialog - Data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} message - Configuration data that guides roll message creation.
	 */
	static applyKeybindings(config, dialog, message) {
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
		if (!this._evaluated) return undefined;
		if (!Number.isNumeric(this.options.target)) return false;
		return this.total < this.options.target;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the result of this roll a success? Returns `undefined` if roll isn't evaluated.
	 * @type {boolean|void}
	 */
	get isSuccess() {
		if (!this._evaluated) return undefined;
		if (!Number.isNumeric(this.options.target)) return false;
		return this.total >= this.options.target;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Chat Messages            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Transform a Roll instance into a ChatMessage, displaying the roll result.
	 * This function can either create the ChatMessage directly, or return the data object that will be used to create.
	 *
	 * @param {BasicRoll[]} rolls - Rolls to add to the message.
	 * @param {object} messageData - The data object to use when creating the message
	 * @param {options} [options] - Additional options which modify the created message.
	 * @param {boolean} [options.create=true] - Whether to automatically create the chat message, or only return the
	 *                                          prepared chatData object.
	 * @param {string} [options.rollMode] - The template roll mode to use for the message from `CONFIG.ChatMessage.modes`.
	 * @returns {Promise<ChatMessage|object>} - A promise which resolves to the created ChatMessage document if create is
	 *                                         true, or the Object of prepared chatData otherwise.
	 */
	static async toMessage(rolls, messageData = {}, { create = true, rollMode } = {}) {
		for (const roll of rolls) {
			if (!roll._evaluated) await roll.evaluate({ allowInteractive: rollMode !== CONST.DICE_ROLL_MODES.BLIND });
			rollMode ??= roll.options.rollMode;
		}
		rollMode ??= BasicRoll.getMessageMode();

		// Prepare chat data
		messageData = foundry.utils.mergeObject(
			{
				user: game.user.id,
				sound: CONFIG.sounds.dice
			},
			messageData
		);
		this._prepareMessageData(rolls, messageData);
		messageData.rolls = rolls.map(r => this.fromData(r.toJSON()));

		// Either create the message or just return the chat data
		const cls = getDocumentClass("ChatMessage");
		const msg = new cls(messageData);

		// Either create or return the data
		if (create) return cls.create(msg.toObject(), { messageMode: rollMode });
		else {
			if (rollMode) msg.applyMode(rollMode);
			return msg.toObject();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform specific changes to message data before creating message.
	 * @param {BasicRoll[]} rolls - Rolls to add to the message.
	 * @param {object} messageData - The data object to use when creating the message.
	 * @protected
	 */
	static _prepareMessageData(rolls, messageData) {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Inversion              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Invert the roll's formula, resulting in a formula whose total, if multiplied by -1, will be the same as
	 * the evaluated total of the original formula.
	 * @returns {BasicRoll}
	 */
	invert() {
		// Add "0 +" to the start of formulas that don't begin with a numeric term
		if (!(this.terms[0] instanceof foundry.dice.terms.NumericTerm))
			this.terms.unshift(
				new foundry.dice.terms.NumericTerm({ number: 0 }),
				new foundry.dice.terms.OperatorTerm({ operator: "+" })
			);
		// Otherwise remove "0 -" from formulas that start with that
		else if (this.terms[0]?.number === 0 && this.terms[1]?.operator === "-") this.terms.splice(0, 2);

		// Starting numeric terms should be directly inverted
		if (this.terms[0] instanceof foundry.dice.terms.NumericTerm) this.terms[0].number *= -1;

		// Invert all addition & subtraction operators
		this.terms = this.terms.map((term, index) => {
			if (term instanceof foundry.dice.terms.OperatorTerm) {
				if (term.operator === "+") term.operator = "-";
				else if (term.operator === "-") term.operator = "+";
			}
			return term;
		});

		if (this._evaluated) this._total *= -1;
		this.resetFormula();
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve the message mode to use, treating in-character as public by default.
	 * @param {boolean} [ignoreIC=true]  Ignore in-character message mode.
	 * @returns {string}}
	 */
	static getMessageMode(ignoreIC = true) {
		const mode = game.settings.get("core", "messageMode");
		return ignoreIC && mode === "ic" ? "public" : mode;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Merge two roll configurations in place.
	 * @param {Partial<BasicRollConfiguration>} original - The initial configuration that will be merged into.
	 * @param {Partial<BasicRollConfiguration>} other - The configuration to merge.
	 * @returns {Partial<BasicRollConfiguration>} - The original instance.
	 */
	static mergeConfigs(original, other = {}) {
		if (other.data) {
			original.data ??= {};
			Object.assign(original.data, other.data);
		}

		if (other.parts?.length) {
			original.parts ??= [];
			original.parts.unshift(...other.parts);
		}

		if (other.options) {
			original.options = this.mergeOptions(original.options, other.options);
		}

		return original;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Merge two roll options objects.
	 * @param {Partial<BasicRollOptions>} [original] - The initial options that will be merged into.
	 * @param {Partial<BasicRollOptions>} [other] - The options to merge.
	 * @returns {Partial<BasicRollOptions>} - The merged version.
	 */
	static mergeOptions(original = {}, other = {}) {
		return foundry.utils.mergeObject(original, other, { inplace: false });
	}
}
