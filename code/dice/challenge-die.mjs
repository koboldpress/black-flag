/**
 * Primary die used when performing a challenge roll.
 */
export default class ChallengeDie extends Die {
	constructor({number=1, faces=20, ...args}={}) {
		super({number, faces, ...args});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Critical success target if no critical failure is set in options.
	 * @type {number}
	 */
	static CRITICAL_SUCCESS_TOTAL = 20;

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Critical failure target if no critical failure is set in options.
	 * @type {number}
	 */
	static CRITICAL_FAILURE_TOTAL = 1;

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Possible advantage modes for this die.
	 * @enum {number}
	 */
	static MODES = {
		NORMAL: 0,
		ADVANTAGE: 1,
		DISADVANTAGE: -1
	};

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Is the result of this roll a critical success? Returns `undefined` if roll isn't evaluated.
	 * @type {boolean|void}
	 */
	get isCriticalSuccess() {
		if ( !this.isValid || !this._evaluated ) return undefined;
		if ( !Number.isNumeric(this.options.criticalSuccess) ) return false;
		return this.total >= this.options.criticalSuccess;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Is the result of this roll a critical failure? Returns `undefined` if roll isn't evaluated.
	 * @type {boolean|void}
	 */
	get isCriticalFailure() {
		if ( !this.isValid || !this._evaluated ) return undefined;
		if ( !Number.isNumeric(this.options.criticalFailure) ) return false;
		return this.total <= this.options.criticalFailure;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Is this a valid challenge die?
	 * @type {boolean}
	 */
	get isValid() {
		return this.faces === 20;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Apply advantage mode to this die.
	 * @param {number} advantageMode - Advantage mode to apply, defined by {@link ChallengeRoll#MODES}.
	 */
	applyAdvantage(advantageMode) {
		this.options.advantageMode = advantageMode;
		if ( advantageMode !== this.constructor.MODES.NORMAL ) {
			this.number = 2;
			this.modifiers.push(advantageMode === this.constructor.MODES.ADVANTAGE ? "kh" : "kl");
		} else {
			this.number = 1;
		}
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Apply a minimum value to this die.
	 * @param {number} minimum - Minimum value the die will be able to roll.
	 */
	applyMinimum(minimum) {
		this.options.minimum = minimum;
		this.modifiers.findSplice(m => m.startsWith("min"));
		if ( minimum ) this.modifiers.push(`min${minimum}`);
	}
}
