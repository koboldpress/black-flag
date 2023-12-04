import FormulaField from "./formula-field.mjs";

/**
 * Field for storing damage data.
 */
export default class DamageField extends foundry.data.fields.SchemaField {
	constructor(fields={}, options={}) {
		fields = {
			number: new foundry.data.fields.NumberField({min: 0, integer: true, label: "BF.Die.Number.Label"}),
			denomination: new foundry.data.fields.NumberField({min: 0, integer: true, label: "BF.Die.Denomination.Label"}),
			type: new foundry.data.fields.StringField({label: "BF.Damage.Type.Label"}),
			bonus: new FormulaField({label: "BF.Damage.Bonus.Label"}),
			custom: new FormulaField({label: "BF.Formula.Custom.Label"}),
			...fields
			// TODO: Add custom critical handling on a per-damage basis
		};
		Object.entries(fields).forEach(([k, v]) => !v ? delete fields[k] : null);
		super(fields, { label: "BF.Damage.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	initialize(value, model, options={}) {
		const obj = super.initialize(value, model, options);

		Object.defineProperty(obj, "formula", {
			get() {
				if ( this.custom ) return this.custom;
				if ( !this.number || !this.denomination ) return this.bonus ?? "";
				let formula = `${this.number}d${this.denomination}`;
				if ( this.bonus ) formula += ` + ${this.bonus}`;
				return formula;
			},
			configurable: true,
			enumerable: false
		});

		return obj;
	}
}
