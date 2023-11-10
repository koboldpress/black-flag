const { StringField } = foundry.data.fields;

/**
 * Base scale value data type that stores generic string values.
 */
export default class ScaleTypeString extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			value: new StringField({blank: false})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Information on how a scale value of this type is configured.
	 *
	 * @typedef {object} ScaleValueTypeMetadata
	 * @property {string} label - Name of this type.
	 * @property {string} hint - Hint for this type shown in the scale value configuration.
	 * @property {string} input - What input interface should be displayed. Default values are "string", "number", "dice",
	 *                            and "distance".
	 */

	/**
	 * Configuration information for this scale value type.
	 * @type {ScaleValueTypeMetadata}
	 */
	static metadata = Object.freeze({
		label: "BF.Advancement.ScaleValue.Type.String.Label",
		hint: "BF.Advancement.ScaleValue.Type.String.Hint",
		input: "string"
	});

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Attempt to convert another scale value type to this one.
	 * @param {ScaleValueType} original - Original type to attempt to convert.
	 * @param {object} [options] - Options which affect DataModel construction.
	 * @returns {ScaleValueType|null}
	 */
	static convertFrom(original, options) {
		return new this({value: original.formula}, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * For scale values with multiple properties, have missing properties inherit from earlier filled-in values.
	 * @param {ScaleTypeString} value - The primary value.
	 * @param {ScaleTypeString} lastValue - The previous value.
	 * @returns {ScaleTypeString}
	 */
	static merge(value, lastValue) {
		Object.keys(lastValue ?? {}).forEach(k => value[k] ??= lastValue[k]);
		return value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * This scale value formatted for display.
	 * @type {string|null}
	 */
	get display() {
		return this.formula;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this value currently considered empty?
	 * @type {boolean}
	 */
	get empty() {
		return !Object.values(this).some(v => !!v);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * This scale value prepared to be used in roll formulas.
	 * @type {string}
	 */
	get formula() {
		return this.value ? `${this.value}` : "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Format this object as a placeholder for display in the config form.
	 * @returns {ScaleValueString}
	 */
	get placeholder() {
		const placeholder = foundry.utils.deepClone(this);
		placeholder.value ??= "";
		return placeholder;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Shortcut to the prepared value when used in roll formulas.
	 * @returns {string}
	 */
	toString() {
		return this.formula;
	}
}
