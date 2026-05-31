/**
 * Object describing the proficiency for a specific ability or skill.
 *
 * @param {number} [proficiency=0] - Actor's flat proficiency bonus based on their current level.
 * @param {number} [multiplier=0] - Value by which to multiply the actor's base proficiency value.
 * @param {string} [rounding=down] - Should half-values be rounded up or down?
 */
export default class Proficiency {
	constructor(proficiency, multiplier, rounding) {
		this.#baseProficiency = Number(proficiency ?? 0);
		this.multiplier = Number(multiplier ?? 0);
		this.rounding = rounding ?? "down";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Base proficiency value of the actor.
	 * @type {number}
	 * @private
	 */
	#baseProficiency;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Value by which to multiply the actor's base proficiency value.
	 * @type {number}
	 */
	multiplier;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Direction decimal results should be rounded ("up" or "down").
	 * @type {string}
	 */
	rounding;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Flat proficiency value regardless of proficiency mode.
	 * @type {number}
	 */
	get flat() {
		const roundMethod = this.rounding === "down" ? Math.floor : Math.ceil;
		return roundMethod(this.multiplier * this.#baseProficiency);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Dice-based proficiency value regardless of proficiency mode.
	 * @type {string}
	 */
	get dice() {
		if (this.#baseProficiency === 0 || this.multiplier === 0) return "0";
		const roundTerm = this.rounding === "down" ? "floor" : "ceil";
		if (this.multiplier === 0.5) {
			return `${roundTerm}(1d${this.#baseProficiency * 2} / 2)`;
		} else {
			return `${this.multiplier}d${this.#baseProficiency * 2}`;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Proficiency term to use in dice rolls.
	 * @type {string}
	 */
	get term() {
		return game.settings.get(game.system.id, "proficiencyMode") === "dice" ? this.dice : String(this.flat);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Whether the proficiency is greater than zero.
	 * @type {boolean}
	 */
	get hasProficiency() {
		return this.#baseProficiency > 0 && this.multiplier > 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Label based on the current proficiency mode.
	 * @type {string}
	 */
	get label() {
		return _loc(
			{
				0: "BF.Proficiency.Level.None",
				0.5: "BF.Proficiency.Level.Half",
				1: "BF.Proficiency.Level.Proficient",
				2: "BF.Proficiency.Level.Expertise"
			}[this.multiplier]
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate an actor's proficiency modifier based on level or CR.
	 * @param {number} level - Level or CR To use for calculating proficiency modifier.
	 * @param {string} [type] - Actor type for which the proficiency is being calculated.
	 * @returns {number} - Proficiency modifier.
	 */
	static calculateMod(level, type) {
		if (type === "pc" && level > CONFIG.BlackFlag.maxLevel) level -= 2;
		return Math.floor((level + 7) / 4);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return a clone of this proficiency with any changes applied.
	 * @param {object} [updates={}]
	 * @param {number} updates.proficiency - Actor's flat proficiency bonus based on their current level.
	 * @param {number} updates.multiplier - Value by which to multiply the actor's base proficiency value.
	 * @param {string} updates.rounding - Should half-values be rounded up or down?
	 * @returns {Proficiency}
	 */
	clone({ proficiency, multiplier, rounding } = {}) {
		proficiency ??= this.#baseProficiency;
		multiplier ??= this.multiplier;
		rounding ??= this.rounding === "down";
		return new this.constructor(proficiency, multiplier, rounding);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Override the default `toString` method to return flat proficiency for backwards compatibility in formula.
	 * @returns {string} - Flat proficiency value.
	 */
	toString() {
		return this.term;
	}
}
