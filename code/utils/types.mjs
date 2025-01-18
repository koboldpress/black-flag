/**
 * Version of Map that includes a default value that will be used whenever retrieving a value if its key doesn't exist.
 */
export class DefaultMap extends Map {
	constructor(iterable, makeDefault) {
		super(iterable);
		this.#makeDefault = makeDefault;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Function used to create the default value for this map.
	 * @type {Function<DefaultMap: Any>}
	 */
	#makeDefault;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get(key) {
		if ( !this.has(key) ) this.set(key, this.#makeDefault(this));
		return super.get(key);
	}
}
