import FormulaField from "./formula-field.mjs";

/**
 * Field for storing damage data.
 */
export default class DamageField extends foundry.data.fields.SchemaField {
	constructor(fields={}, options={}) {
		super({
			number: new foundry.data.fields.NumberField({min: 0, integer: true, label: "BF.Die.Number.Label"}),
			denomination: new foundry.data.fields.NumberField({min: 1, integer: true, label: "BF.Die.Denomination.Label"}),
			type: new foundry.data.fields.StringField({label: "BF.Damage.Type.Label"}),
			custom: new FormulaField({label: "BF.Formula.Custom.Label"}),
			...fields
			// TODO: Add custom critical handling on a per-damage basis
		}, { label: "BF.Damage.Label", ...options });
	}
}
