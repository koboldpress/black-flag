import FormulaField from "./formula-field.mjs";

/**
 * Field that represents a actor modifier.
 */
export default class ModifierField extends foundry.data.fields.SchemaField {
	constructor(options) {
		super({
			type: new foundry.data.fields.StringField(), // Values: bonus, min, (others?)
			filter: new foundry.data.fields.ArrayField(new foundry.data.fields.ObjectField()),
			formula: new FormulaField({required: false, initial: undefined})
			// TODO: Other "types" might require additional optional fields
		}, options);
	}
}
