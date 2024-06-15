import FormulaField from "./formula-field.mjs";

const { BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing damage data.
 */
export default class DamageField extends foundry.data.fields.SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			number: new NumberField({ min: 0, integer: true, label: "BF.Die.Number.Label" }),
			denomination: new NumberField({ min: 0, integer: true, label: "BF.Die.Denomination.Label" }),
			type: new StringField({ label: "BF.Damage.Type.Label" }),
			bonus: new FormulaField({ label: "BF.Damage.Bonus.Label" }),
			custom: new SchemaField(
				{
					enabled: new BooleanField(),
					formula: new FormulaField({ label: "BF.Formula.Custom.Label" })
				},
				{ required: false }
				// TODO: Figure out why "required: false" is needed here to avoid issues with HealingActivity
			),
			scaling: new SchemaField({
				mode: new StringField({ label: "BF.Damage.Scaling.Mode.Label" }),
				number: new NumberField({ initial: 1, min: 0, integer: true, label: "BF.Damage.Scaling.Dice.Label" }),
				formula: new FormulaField()
			}),
			...fields
			// TODO: Add custom critical handling on a per-damage basis
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, { label: "BF.Damage.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		const obj = super.initialize(value, model, options);

		Object.defineProperty(obj, "formula", {
			get() {
				if (this.custom?.enabled) return this.custom?.formula;
				if (!this.number || !this.denomination) return this.bonus ?? "";
				let formula = `${this.number}d${this.denomination}`;
				if (this.bonus) formula += ` + ${this.bonus}`;
				return formula;
			},
			configurable: true,
			enumerable: false
		});

		return obj;
	}
}
