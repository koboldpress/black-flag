/**
 * Error to throw when consumption cannot be achieved.
 */
export default class ConsumptionError extends Error {
	constructor(...args) {
		super(...args);
		this.name = "ConsumptionError";
	}
}
