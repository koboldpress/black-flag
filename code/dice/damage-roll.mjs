import DamageConfigurationDialog from "../applications/dice/damage-configuration-dialog.mjs";
import { areKeysPressed } from "../utils/_module.mjs";
import BaseRoll from "./base-roll.mjs";

/**
 * Damage roll configuration data.
 *
 * @typedef {BaseRollConfiguration} DamageRollConfiguration
 * @property {DamageRollOptions} [options] - Options passed through to the roll.
 */

/**
 * Options that describe a challenge roll.
 *
 * @typedef {BaseRollOptions} DamageRollOptions
 * @property {boolean} [allowCritical=true] - Should critical damage be allowed?
 * @property {boolean} [critical] - Does this roll do critical damage?
 * @property {number} [multiplier=2] - Amount by which to multiply critical damage.
 * @property {boolean} [multiplyNumeric=false] - Should numeric terms be multiplied along side dice
 *                                               during criticals?
 * @property {number} [bonusDice=0] - Additional dice added to first term when calculating critical damage.
 * @property {string} [bonusDamage] - Additional, unmodified, damage formula added when calculating a critical.
 * @property {string} [type] - Type of damage represented.
 */

/**
 * Roll used for damage with helpers for calculating critical damage.
 * @param {string} formula - The formula used to construct the roll.
 * @param {object} data - The roll data used to resolve the formula.
 * @param {DamageRollOptions} options - Additional options that describe the challenge roll.
 */
export default class DamageRoll extends BaseRoll {
	constructor(formula, data, options={}) {
		super(formula, data, options);
		if ( !this.options.preprocessed ) this.#preprocessFormula();
		if ( !this.options.configured ) this.configureRoll();
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	static DefaultConfigurationDialog = DamageConfigurationDialog;

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	static CHAT_TEMPLATE = "systems/black-flag/templates/dice/damage-roll.hbs";

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Static Constructor                       */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Determines whether the roll should be fast forwarded and what the default critical mode should be.
	 * @param {DamageRollConfiguration} config - Roll configuration data.
	 * @param {BaseDialogConfiguration} options - Data for the roll configuration dialog.
	 */
	static applyKeybindings(config, options) {
		const keys = {
			normal: areKeysPressed(config.event, "damageRollNormal"),
			critical: areKeysPressed(config.event, "damageRollCritical")
		};

		// Should the roll configuration dialog be displayed?
		options.configure ??= !Object.values(keys).some(k => k);

		// Determine critical mode
		config.options ??= {};
		config.options.critical = !!config.options.critical || keys.critical;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Properties                               */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Is this damage critical?
	 * @type {boolean}
	 */
	get isCritical() {
		return this.options.critical ?? false;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Roll Configuration                       */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Perform any term-merging required to ensure that criticals can be calculated successfully.
	 */
	#preprocessFormula() {
		for ( let [i, term] of this.terms.entries() ) {
			const nextTerm = this.terms[i + 1];
			const prevTerm = this.terms[i - 1];

			// Convert shorthand dX terms to 1dX preemptively to allow them to be appropriately doubled for criticals
			if ( (term instanceof StringTerm) && /^d\d+/.test(term.term) && !(prevTerm instanceof ParentheticalTerm) ) {
				const formula = `1${term.term}`;
				const newTerm = new Roll(formula).terms[0];
				this.terms.splice(i, 1, newTerm);
				term = newTerm;
			}

			// Merge parenthetical terms that follow string terms to build a dice term (to allow criticals)
			else if ( (term instanceof ParentheticalTerm) && (prevTerm instanceof StringTerm)
				&& prevTerm.term.match(/^[0-9]*d$/)) {
				if ( term.isDeterministic ) {
					let newFormula = `${prevTerm.term}${term.evaluate().total}`;
					let deleteCount = 2;

					// Merge in any roll modifiers
					if ( nextTerm instanceof StringTerm ) {
						newFormula += nextTerm.term;
						deleteCount += 1;
					}

					const newTerm = (new Roll(newFormula)).terms[0];
					this.terms.splice(i - 1, deleteCount, newTerm);
					term = newTerm;
				}
			}

			// Merge any parenthetical terms followed by string terms
			else if ( (term instanceof ParentheticalTerm || term instanceof MathTerm) && (nextTerm instanceof StringTerm)
				&& nextTerm.term.match(/^d[0-9]*$/)) {
				if ( term.isDeterministic ) {
					const newFormula = `${term.evaluate().total}${nextTerm.term}`;
					const newTerm = (new Roll(newFormula)).terms[0];
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
	 */
	configureRoll() {
		for ( const [i, term] of this.terms.entries() ) {
			// Multiply dice terms
			if ( term instanceof DiceTerm ) {
				// Reset to base value & store that value for later if it isn't already set
				term.number = term.options.baseNumber ??= term.number;
				if ( this.isCritical ) {
					// TODO: Should "Powerful critical" mode be supported?
					const multiplier = this.options.multiplier ?? 2;
					const bonusDice = (this.options.bonusDice ?? (i === 0)) ? this.options.bonusDice : 0;
					term.alter(multiplier, bonusDice);
					term.options.critical = true;
				}
			}

			// Multiply numeric terms
			else if ( this.options.multiplyNumeric && (term instanceof NumericTerm) ) {
				// Reset to base value & store that value for later if it isn't already set
				term.number = term.options.baseNumber ??= term.number;
				if ( this.isCritical ) {
					term.number *= (this.options.multiplier ?? 2);
					term.options.critical = true;
				}
			}
		}

		if ( this.isCritical && this.options.bonusDamage ) {
			const extra = new Roll(this.options.bonusDamage, this.data);
			if ( !(extra.terms[0] instanceof OperatorTerm) ) this.terms.push(new OperatorTerm({operator: "+"}));
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

	async render({flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false}={}) {
		if ( !this._evaluated ) await this.evaluate({async: true});

		const chatData = {
			CONFIG: CONFIG.BlackFlag,
			formula: isPrivate ? "???" : this._formula,
			flavor: isPrivate ? null : flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
			damageType: isPrivate ? "???" : this.options.type
		};
		return renderTemplate(template, chatData);
	}
}
