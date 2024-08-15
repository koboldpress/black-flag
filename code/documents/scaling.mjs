/**
 * Object describing the scaling of a specific activation.
 *
 * @param {number} increase - Scaling level above baseline.
 */
export default class Scaling {
	constructor(increase) {
		this.#increase = increase;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*  Properties                         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Scaling level above baseline.
	 * @type {number}
	 */
	#increase;

	get increase() {
		return this.#increase;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Value of the scaling starting 1.
	 * @type {string}
	 */
	get value() {
		return this.#increase + 1;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	toString() {
		return this.value;
	}
}
