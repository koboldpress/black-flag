/**
 * @callback MappingFieldInitialValueBuilder
 * @param {string} key - The key within the object where this new value is being generated.
 * @param {*} initial - The generic initial data provided by the contained model.
 * @param {object} existing - Any existing mapping data.
 * @returns {object} - Value to use as default for this key.
 */

/**
 * @typedef {DataFieldOptions} MappingFieldOptions
 * @property {string[]} [initialKeys] - Keys that will be created if no data is provided.
 * @property {MappingFieldInitialValueBuilder} [initialValue] - Function to calculate the initial value for a key.
 * @property {boolean} [prepareKeys=false] - Should the keys in the initialized data be limited to the keys provided
 *                                           by `options.initialKeys`?
 */

/**
 * A subclass of ObjectField that represents a mapping of keys to the provided DataField type.
 *
 * @param {DataField} model - The class of DataField which should be embedded in this field.
 * @param {MappingFieldOptions} [options={}] - Options which configure the behavior of the field.
 * @property {string[]} [initialKeys] - Keys that will be created if no data is provided.
 * @property {MappingFieldInitialValueBuilder} [initialValue] - Function to calculate the initial value for a key.
 * @property {boolean} [prepareKeys=false] - Should the keys in the initialized data be limited to the keys provided
 *                                           by `options.initialKeys`?
 */
export default class MappingField extends foundry.data.fields.TypedObjectField {
	constructor(model, options) {
		if (!(model instanceof foundry.data.fields.DataField)) {
			throw new Error("MappingField must have a DataField as its contained element");
		}
		super(model, options);

		/**
		 * The embedded DataField definition which is contained in this field.
		 * @type {DataField}
		 */
		this.model = this.element;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get _defaults() {
		return foundry.utils.mergeObject(super._defaults, {
			initialKeys: null,
			initialValue: null,
			prepareKeys: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ensure the initial keys are in a usable format.
	 * @returns {string[]|void}
	 */
	_getInitialKeys() {
		const keys = this.initialKeys;
		switch (foundry.utils.getType(keys)) {
			case "Array":
				return keys;
			case "Object":
				return Object.keys(keys);
			case "Set":
				return Array.from(keys);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getInitialValue(data) {
		const keys = this._getInitialKeys();
		const initial = super.getInitialValue(data);
		if (!keys || !foundry.utils.isEmpty(initial)) return initial;
		for (const key of keys) initial[key] = this._getInitialValueForKey(key);
		return initial;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the initial value for the provided key.
	 * @param {string} key - Key within the object being built.
	 * @param {object} [object] - Any existing mapping data.
	 * @returns {*} - Initial value based on provided field type.
	 */
	_getInitialValueForKey(key, object) {
		const initial = this.element.getInitialValue();
		return this.initialValue?.(key, initial, object) ?? initial;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	initialize(value, model, options = {}) {
		if (!value) return value;
		const obj = {};
		const initialKeys = this._getInitialKeys() ?? [];
		const keys = this.prepareKeys ? initialKeys : Object.keys(value);
		for (const key of keys) {
			const data = value[key] ?? this._getInitialValueForKey(key, value);
			obj[key] = this.element.initialize(data, model, options);
		}
		return obj;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_getField(path, options = {}) {
		if (path.length === 0) return this;
		path.pop();
		return this.element._getField(path, options);
	}
}
