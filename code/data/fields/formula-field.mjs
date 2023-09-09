/**
 * @typedef {StringFieldOptions} FormulaFieldOptions
 * @property {boolean} [deterministic=false] - Is this formula not allowed to have dice values?
 */

/**
 * Special case StringField which represents a formula.
 *
 * @param {FormulaFieldOptions} [options={}] - Options which configure the behavior of the field.
 * @property {boolean} deterministic=false - Is this formula not allowed to have dice values?
 */
export default class FormulaField extends foundry.data.fields.StringField {

	static get _defaults() {
		return foundry.utils.mergeObject(super._defaults, {
			deterministic: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_validateType(value) {
		if ( this.options.deterministic ) {
			const roll = new Roll(value);
			if ( !roll.isDeterministic ) throw new Error("must not contain dice terms");
			Roll.safeEval(roll.formula);
		}
		else Roll.validate(value);
		super._validateType(value);
	}
}
