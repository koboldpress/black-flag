import DamageRollConfigurationDialog from "../applications/dice/damage-configuration-dialog.mjs";
import { areKeysPressed } from "../utils/_module.mjs";
import BasicRoll from "./basic-roll.mjs";

/**
 * Configuration data for the process of rolling a damage roll.
 *
 * @typedef {BasicRollProcessConfiguration} DamageRollProcessConfiguration
 * @property {DamageRollConfiguration[]} rolls - Configuration data for individual rolls.
 * @property {boolean} [allowCritical=true] - Should critical damage be allowed?
 * @property {CriticalDamageConfiguration} [critical] - Critical configuration for all rolls.
 * @property {number} [scaling=0] - Scale increase above base damage.
 */

/**
 * Damage roll configuration data.
 *
 * @typedef {BasicRollConfiguration} DamageRollConfiguration
 * @property {DamageRollOptions} [options] - Options passed through to the roll.
 */

/**
 * Critical effects configuration data.
 *
 * @typedef {object} CriticalDamageConfiguration
 * @property {number} [multiplier=2] - Amount by which to multiply critical damage.
 * @property {number} [bonusDice=0] - Additional dice added to first term when calculating critical damage.
 * @property {string} [bonusDamage] - Additional, unmodified, damage formula added when calculating a critical.
 * @property {string} [maximizeDamage] - Maximize result of extra dice added by critical, rather than rolling.
 * @property {boolean} [multiplyDice] - Should dice result be multiplied rather than number of dice rolled increased?
 * @property {boolean} [multiplyNumeric] - Should numeric terms be multiplied along side dice during criticals?
 */

/**
 * Options that describe a challenge roll.
 *
 * @typedef {BasicRollOptions} DamageRollOptions
 * @property {boolean} [isCritical] - Should critical damage by calculated for this roll?
 * @property {CriticalDamageConfiguration} [critical] - Critical configuration for this roll.
 * @property {string} [type] - Type of damage represented.
 */

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Roll used for damage with helpers for calculating critical damage.
 * @param {string} formula - The formula used to construct the roll.
 * @param {object} data - The roll data used to resolve the formula.
 * @param {DamageRollOptions} options - Additional options that describe the challenge roll.
 */
export default class DamageRoll extends BasicRoll {
	constructor(formula, data, options = {}) {
		super(formula, data, options);
		if (!this.options.preprocessed) this.#preprocessFormula();
		if (!this.options.configured) this.configureRoll();
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/** @inheritDoc */
	static DefaultConfigurationDialog = DamageRollConfigurationDialog;

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/** @inheritDoc */
	static CHAT_TEMPLATE = "systems/black-flag/templates/dice/damage-roll.hbs";

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Static Construction         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determines whether the roll should be fast forwarded and what the default critical mode should be.
	 * @param {DamageRollProcessConfiguration} config - Roll configuration data.
	 * @param {BasicRollDialogConfiguration} dialog - Data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} message - Configuration data that guides roll message creation.
	 */
	static applyKeybindings(config, dialog, message) {
		const keys = {
			normal: areKeysPressed(config.event, "damageRollNormal"),
			critical: areKeysPressed(config.event, "damageRollCritical")
		};

		// Should the roll configuration dialog be displayed?
		dialog.configure ??= !Object.values(keys).some(k => k);

		// Determine critical mode
		for (const roll of config.rolls) {
			roll.options ??= {};
			roll.options.isCritical = !!roll.options.isCritical || keys.critical;
			roll.options.critical ??= {};
			roll.options.critical.maximizeDamage ??= game.settings.get("black-flag", "criticalMaximizeDamage");
			roll.options.critical.multiplyDice ??= game.settings.get("black-flag", "criticalMultiplyDice");
			roll.options.critical.multiplyNumeric ??= game.settings.get("black-flag", "criticalMultiplyNumeric");
		}
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Properties                               */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Is this damage critical?
	 * @type {boolean}
	 */
	get isCritical() {
		return this.options.isCritical === true;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Roll Configuration                       */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Perform any term-merging required to ensure that criticals can be calculated successfully.
	 */
	#preprocessFormula() {
		const FunctionTerm_ = game.release.generation < 12 ? MathTerm : foundry.dice.terms.FunctionTerm;
		const ParentheticalTerm_ = game.release.generation < 12 ? ParentheticalTerm : foundry.dice.terms.ParentheticalTerm;
		const StringTerm_ = game.release.generation < 12 ? StringTerm : foundry.dice.terms.StringTerm;

		for (let [i, term] of this.terms.entries()) {
			const nextTerm = this.terms[i + 1];
			const prevTerm = this.terms[i - 1];

			// Convert shorthand dX terms to 1dX preemptively to allow them to be appropriately doubled for criticals
			if (term instanceof StringTerm_ && /^d\d+/.test(term.term) && !(prevTerm instanceof ParentheticalTerm_)) {
				const formula = `1${term.term}`;
				const newTerm = new Roll(formula).terms[0];
				this.terms.splice(i, 1, newTerm);
				term = newTerm;
			}

			// Merge parenthetical terms that follow string terms to build a dice term (to allow criticals)
			else if (
				term instanceof ParentheticalTerm_ &&
				prevTerm instanceof StringTerm_ &&
				prevTerm.term.match(/^[0-9]*d$/)
			) {
				if (term.isDeterministic) {
					let newFormula = `${prevTerm.term}${term.evaluate().total}`;
					let deleteCount = 2;

					// Merge in any roll modifiers
					if (nextTerm instanceof StringTerm_) {
						newFormula += nextTerm.term;
						deleteCount += 1;
					}

					const newTerm = new Roll(newFormula).terms[0];
					this.terms.splice(i - 1, deleteCount, newTerm);
					term = newTerm;
				}
			}

			// Merge any parenthetical terms followed by string terms
			else if (
				(term instanceof ParentheticalTerm_ || term instanceof FunctionTerm_) &&
				nextTerm instanceof StringTerm_ &&
				nextTerm.term.match(/^d[0-9]*$/)
			) {
				if (term.isDeterministic) {
					const newFormula = `${term.evaluate().total}${nextTerm.term}`;
					const newTerm = new Roll(newFormula).terms[0];
					this.terms.splice(i, 2, newTerm);
					term = newTerm;
				}
			}
		}

		// Re-compile the underlying formula
		this.resetFormula();

		// Mark preprocessing as complete
		this.options.preprocessed = true;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Modify the damage to take criticals into account.
	 * @param {object} [options={}]
	 * @param {CriticalDamageConfiguration} [options.critical={}] - Critical configuration to take into account, will be
	 *                                                              superseded by the the roll's configuration.
	 */
	configureRoll({ critical = {} } = {}) {
		const DiceTerm_ = game.release.generation < 12 ? DiceTerm : foundry.dice.terms.DiceTerm;
		const NumericTerm_ = game.release.generation < 12 ? NumericTerm : foundry.dice.terms.NumericTerm;
		const OperatorTerm_ = game.release.generation < 12 ? OperatorTerm : foundry.dice.terms.OperatorTerm;
		const ParentheticalTerm_ = game.release.generation < 12 ? ParentheticalTerm : foundry.dice.terms.ParentheticalTerm;

		foundry.utils.mergeObject(critical, this.options.critical ?? {});

		let bonus = 0;
		const multiplier = critical.multiplier ?? 2;

		for (const [i, term] of this.terms.entries()) {
			// Multiply dice terms
			if (term instanceof DiceTerm_) {
				// Reset to base value & store that value for later if it isn't already set
				term.number = term.options.baseNumber ??= term.number;
				if (this.isCritical) {
					let termMultiplier = multiplier;
					const bonusDice = critical.bonusDice ?? i === 0 ? critical.bonusDice : 0;

					// Maximize Critical - Maximize one die and reduce to the multiplier by one to account for it.
					if (critical.maximizeDamage) {
						bonus += (term.number + bonusDice) * term.faces;
						termMultiplier = Math.max(1, termMultiplier - 1);
					} else {
						term.alter(critical.multiplyDice ? null : termMultiplier, bonusDice);
					}

					term.options.critical = true;

					// Multiply Dice - Add term to multiply dice result (as long as multiply numeric isn't also set)
					if (critical.multiplyDice && !critical.multiplyNumeric)
						this.terms.splice(
							i + 1,
							0,
							new OperatorTerm_({ operator: "*" }),
							new NumericTerm_({ number: termMultiplier })
						);
				}
			}

			// Multiply Numeric - Modify numeric terms (as long as multiply dice isn't also set)
			else if (critical.multiplyNumeric && !critical.multiplyDice && term instanceof NumericTerm_) {
				// Reset to base value & store that value for later if it isn't already set
				term.number = term.options.baseNumber ??= term.number;
				if (this.isCritical) {
					term.number *= multiplier;
					term.options.critical = true;
				}
			}
		}

		// Multiply Dice & Numeric: Wrap whole formula in parenthetical term and multiply
		if (this.isCritical && critical.multiplyDice && critical.multiplyNumeric && multiplier > 1) {
			this.terms = [ParentheticalTerm_.fromTerms(this.terms)];
			this.terms.push(new OperatorTerm_({ operator: "*" }));
			this.terms.push(new NumericTerm_({ number: multiplier }));
		}

		// Add flat bonus back in
		if (bonus > 0) {
			this.terms.push(new OperatorTerm_({ operator: "+" }));
			this.terms.push(
				new NumericTerm_({ number: bonus }, { flavor: game.i18n.localize("BF.Damage.Critical.Maximize") })
			);
		}

		// Add extra critical damage
		if (this.isCritical && critical.bonusDamage) {
			const extra = new Roll(critical.bonusDamage, this.data);
			if (!(extra.terms[0] instanceof OperatorTerm_)) this.terms.push(new OperatorTerm_({ operator: "+" }));
			this.terms.push(...extra.terms);
		}

		// Re-compile the underlying formula
		this.resetFormula();

		// Mark configuration as complete
		this.options.configured = true;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Chat Messages                            */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/** @inheritDoc */
	async render({ flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false } = {}) {
		if (!this._evaluated) await this.evaluate({ async: true });

		const chatData = {
			CONFIG: CONFIG.BlackFlag,
			formula: isPrivate ? "???" : this._formula,
			flavor: isPrivate ? null : flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
			damageType: isPrivate ? "???" : this.options.damageType
		};
		return renderTemplate(template, chatData);
	}
}
