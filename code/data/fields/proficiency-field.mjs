const { NumberField, StringField } = foundry.data.fields;

/**
 * Field for storing proficiency.
 */
export default class ProficiencyField extends foundry.data.fields.SchemaField {
	constructor(fields={}, options={}) {
		fields = {
			multiplier: new NumberField({min: 0, max: 2, initial: 0, step: 0.5, label: "BF.Proficiency.Multiplier"}),
			rounding: new StringField({initial: "down", choices: ["down", "up"], label: "BF.Proficiency.Rounding"}),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => !v ? delete fields[k] : null);
		super(fields, { label: "BF.Proficiency.Label[one]", ...options });
	}
}
