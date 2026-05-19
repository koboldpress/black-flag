/**
 * Field that stores one or more filtering operators.
 */
export default class FilterField extends foundry.data.fields.ArrayField {
	constructor(options, context) {
		super(new foundry.data.fields.ObjectField(), options, context);
	}
}
