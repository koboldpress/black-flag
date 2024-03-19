import ChallengeRollConfigurationDialog from "../applications/dice/challenge-configuration-dialog.mjs";
import { areKeysPressed } from "../utils/_module.mjs";
import BasicRoll from "./basic-roll.mjs";

/**
 * Configuration data for the process of rolling a challenge roll.
 *
 * @typedef {BasicRollProcessConfiguration} ChallengeRollProcessConfiguration
 * @property {ChallengeRollConfiguration[]} rolls - Configuration data for individual rolls.
 */

/**
 * Challenge roll configuration data.
 *
 * @typedef {BasicRollConfiguration} ChallengeRollConfiguration
 * @property {string[]} [parts=[]] - Parts used to construct the roll formula, not including the challenge die.
 * @property {ChallengeRollOptions} [options] - Options passed through to the roll.
 */

/**
 * Options that describe a challenge roll.
 *
 * @typedef {BasicRollOptions} ChallengeRollOptions
 * @property {boolean} [advantage] - Is the roll granted advantage?
 * @property {boolean} [disadvantage] - Is the roll granted disadvantage?
 * @property {number} [criticalSuccess] - The value of the challenge die to be considered a critical success.
 * @property {number} [criticalFailure] - The value of the challenge die to be considered a critical failure.
 * @property {number} [minimum] - Minimum number the challenge die can roll.
 */

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Data for the roll configuration dialog.
 *
 * @typedef {BasicRollDialogConfiguration} ChallengeRollDialogConfiguration
 * @property {ChallengeConfigurationDialogOptions} [options] - Configuration options.
 */

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Roll used for challenges and contests, usually using a D20, such as attacks, checks, and saves.
 * @param {string} formula - The formula used to construct the roll.
 * @param {object} data - The roll data used to resolve the formula.
 * @param {ChallengeRollOptions} options - Additional options that describe the challenge roll.
 */
export default class ChallengeRoll extends BasicRoll {
	constructor(formula, data, options={}) {
		super(formula, data, options);
		this.#createChallengeDie();
		if ( !this.options.configured ) this.configureRoll();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static DefaultConfigurationDialog = ChallengeRollConfigurationDialog;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Static Construction         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a roll instance from the provided config.
	 * @param {ChallengeRollConfiguration} config - Roll configuration data.
	 * @returns {ChallengeRoll[]}
	 */
	static create(config) {
		const formula = [(new CONFIG.Dice.ChallengeDie()).formula].concat(config.parts ?? []).join(" + ");
		return new this(formula, config.data, config.options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Construct and perform a Challenge Roll through the standard workflow.
	 * @param {ChallengeRollProcessConfiguration} [config={}] - Roll configuration data.
	 * @param {ChallengeRollDialogConfiguration} [dialog={}] - Data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message={}] - Configuration data that guides roll message creation.
	 * @returns {BasicRoll[]} - Any rolls created.
	 */
	static async build(config={}, dialog={}, message={}) {
		for ( const roll of config.rolls ?? [] ) {
			roll.options ??= {};
			roll.options.criticalSuccess ??= CONFIG.Dice.ChallengeDie.CRITICAL_SUCCESS_TOTAL;
			roll.options.criticalFailure ??= CONFIG.Dice.ChallengeDie.CRITICAL_FAILURE_TOTAL;
		}
		return super.build(config, dialog, message);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determines whether the roll should be fast forwarded and what the default advantage mode should be.
	 * @param {ChallengeRollProcessConfiguration} config - Roll configuration data.
	 * @param {ChallengeRollDialogConfiguration} dialog - Data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} message - Configuration data that guides roll message creation.
	 */
	static applyKeybindings(config, dialog, message) {
		const keys = {
			normal: areKeysPressed(config.event, "challengeRollNormal"),
			advantage: areKeysPressed(config.event, "challengeRollAdvantage"),
			disadvantage: areKeysPressed(config.event, "challengeRollDisadvantage")
		};

		// Should the roll configuration dialog be displayed?
		dialog.configure ??= !Object.values(keys).some(k => k);

		// Determine advantage mode
		for ( const roll of config.rolls ) {
			roll.options ??= {};
			const advantage = roll.options.advantage || keys.advantage;
			const disadvantage = roll.options.disadvantage || keys.disadvantage;
			if ( advantage && !disadvantage ) roll.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.ADVANTAGE;
			else if ( !advantage && disadvantage ) roll.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.DISADVANTAGE;
			else roll.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.NORMAL;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The primary die used in this challenge.
	 * @type {ChallengeDie|void}
	 */
	get challengeDie() {
		if ( !(this.terms[0] instanceof Die) ) return undefined;
		return this.terms[0];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set the challenge die for this roll.
	 */
	set challengeDie(die) {
		if ( !(die instanceof CONFIG.Dice.ChallengeDie) ) throw new Error(
			`Challenge die must be an instance of ${CONFIG.Dice.ChallengeDie.name}, `
			+ `instead a ${die.constructor.name} was provided.`
		);
		this.terms[0] = die;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this challenge roll performed with advantage?
	 * @type {boolean}
	 */
	get hasAdvantage() {
		return this.options.advantageMode === CONFIG.Dice.ChallengeRoll.MODES.ADVANTAGE;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this challenge roll performed with disadvantage?
	 * @type {boolean}
	 */
	get hasDisadvantage() {
		return this.options.advantageMode === CONFIG.Dice.ChallengeRoll.MODES.DISADVANTAGE;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the result of this roll a critical success? Returns `undefined` if roll isn't evaluated.
	 * @type {boolean|void}
	 */
	get isCriticalSuccess() {
		this.#createChallengeDie();
		return this.challengeDie.isCriticalSuccess;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the result of this roll a critical failure? Returns `undefined` if roll isn't evaluated.
	 * @type {boolean|void}
	 */
	get isCriticalFailure() {
		this.#createChallengeDie();
		return this.challengeDie.isCriticalFailure;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this a valid challenge role?
	 * @type {boolean}
	 */
	get isValidRoll() {
		return (this.challengeDie instanceof CONFIG.Dice.ChallengeDie) && this.challengeDie.isValid;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Roll Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Modify the damage to take advantage and any other modifiers into account.
	 */
	configureRoll() {
		// Directly modify the challenge die
		this.challengeDie.applyAdvantage(this.options.advantageMode ?? CONFIG.Dice.ChallengeDie.MODES.NORMAL);
		this.challengeDie.applyMinimum(this.options.minimum ?? 0);

		// Critical thresholds & target value
		if ( this.options.criticalSuccess ) this.challengeDie.options.criticalSuccess = this.options.criticalSuccess;
		if ( this.options.criticalFailure ) this.challengeDie.options.criticalFailure = this.options.criticalFailure;
		if ( this.options.target ) this.challengeDie.options.target = this.options.target;

		// Re-compile the underlying formula
		this.resetFormula();

		// Mark configuration as complete
		this.options.configured = true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ensure the challenge die for this roll is a proper ChallengeDie, not a regular Die.
	 */
	#createChallengeDie() {
		if ( this.challengeDie instanceof CONFIG.Dice.ChallengeDie ) return;
		if ( !(this.challengeDie instanceof Die) ) return;
		this.challengeDie = new CONFIG.Dice.ChallengeDie({...this.challengeDie});
	}
}
