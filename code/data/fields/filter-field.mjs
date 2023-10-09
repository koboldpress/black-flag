/**
 * Field that stores one or more filtering operators.
 */
export default class FilterField extends foundry.data.fields.ArrayField {
	constructor(options) {
		super(new foundry.data.fields.ObjectField(), options);
	}
}
