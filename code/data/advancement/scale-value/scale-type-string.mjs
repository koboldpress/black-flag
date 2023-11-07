const { StringField } = foundry.data.fields;

/**
 * Base scale value data type that stores generic string values.
 */
export default class ScaleTypeString extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			value: new StringField({required: true})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Information on how a scale value of this type is configured.
	 *
	 * @typedef {object} ScaleValueTypeMetadata
	 * @property {string} label - Name of this type.
	 * @property {string} hint - Hint for this type shown in the scale value configuration.
	 * @property {boolean} isNumeric - When using the default editing interface, should numeric inputs be used?
	 */

	/**
	 * Configuration information for this scale value type.
	 * @type {ScaleValueTypeMetadata}
	 */
	static metadata = Object.freeze({
		label: "BF.Advancement.ScaleValue.Type.String.Label",
		hint: "BF.Advancement.ScaleValue.Type.String.Hint",
		isNumeric: false
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
	 * This scale value prepared to be used in roll formulas.
	 * @type {string|null}
	 */
	get formula() { return this.value; }

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * This scale value formatted for display.
	 * @type {string|null}
	 */
	get display() { return this.formula; }

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Shortcut to the prepared value when used in roll formulas.
	 * @returns {string}
	 */
	toString() {
		return this.formula;
	}
}
