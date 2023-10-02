import { areKeysPressed } from "../utils/dice.mjs";
import BaseRoll from "./base-roll.mjs";
import ChallengeConfigurationDialog from "./challenge-configuration-dialog.mjs";

/**
 * Challenge roll configuration data.
 *
 * @typedef {BaseRollConfiguration} ChallengeRollConfiguration
 * @property {string[]} [parts=[]] - Parts used to construct the roll formula, not including the challenge die.
 * @property {ChallengeRollOptions} [options] - Options passed through to the roll.
 */

/**
 * Options that describe a challenge roll.
 *
 * @typedef {BaseRollOptions} ChallengeRollOptions
 * @property {boolean} [advantage] - Is the roll granted advantage?
 * @property {boolean} [disadvantage] - Is the roll granted disadvantage?
 * @property {number} [criticalSuccess] - The value of the challenge die to be considered a critical success.
 * @property {number} [criticalFailure] - The value of the challenge die to be considered a critical failure.
 * @property {number} [minimum] - Minimum number the challenge die can roll.
 */

/**
 * @typedef {BaseDialogConfiguration} ChallengeDialogConfiguration
 * @property {ChallengeConfigurationDialogOptions} [options] - Configuration options.
 */

/**
 * @typedef {BaseConfigurationDialogOptions} ChallengeConfigurationDialogOptions
 * @property {boolean} [chooseAbility=false] - Should the ability selector be shown?
 */

/**
 * Roll used for challenges and contests, usually using a D20, such as attacks, checks, and saves.
 * @param {string} formula - The formula used to construct the roll.
 * @param {object} data - The roll data used to resolve the formula.
 * @param {ChallengeRollOptions} options - Additional options that describe the challenge roll.
 */
export default class ChallengeRoll extends BaseRoll {
	constructor(formula, data, options={}) {
		super(formula, data, options);
		this.#createChallengeDie();
		if ( !this.options.configured ) this.configureRoll();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static DefaultConfigurationDialog = ChallengeConfigurationDialog;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Static Constructor         */
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
	 * @param {ChallengeRollConfiguration|ChallengeRollConfiguration[]} [configs={}] - Roll configuration data.
	 * @param {BaseMessageConfiguration} [message={}] - Configuration data that guides roll message creation.
	 * @param {ChallengeDialogConfiguration} [dialog={}] - Data for the roll configuration dialog.
	 * @returns {BaseRoll[]} - Any rolls created.
	 */
	static async build(configs={}, message={}, dialog={}) {
		if ( foundry.utils.getType(configs) === "Object" ) configs = [configs];
		for ( const config of configs ) {
			config.options ??= {};
			config.options.criticalSuccess ??= CONFIG.Dice.ChallengeDie.CRITICAL_SUCCESS_TOTAL;
			config.options.criticalFailure ??= CONFIG.Dice.ChallengeDie.CRITICAL_FAILURE_TOTAL;
		}
		return super.build(configs, message, dialog);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determines whether the roll should be fast forwarded and what the default advantage mode should be.
	 * @param {ChallengeRollConfiguration} config - Roll configuration data.
	 * @param {BaseDialogConfiguration} options - Data for the roll configuration dialog.
	 */
	static applyKeybindings(config, options) {
		const keys = {
			normal: areKeysPressed(config.event, "challengeRollNormal"),
			advantage: areKeysPressed(config.event, "challengeRollAdvantage"),
			disadvantage: areKeysPressed(config.event, "challengeRollDisadvantage")
		};

		// Should the roll configuration dialog be displayed?
		options.configure ??= !Object.values(keys).some(k => k);

		// Determine advantage mode
		const advantage = config.advantage || keys.advantage;
		const disadvantage = config.disadvantage || keys.disadvantage;
		config.options ??= {};
		if ( advantage && !disadvantage ) config.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.ADVANTAGE;
		else if ( !advantage && disadvantage ) config.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.DISADVANTAGE;
		else config.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.NORMAL;
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
