import FormulaField from "./formula-field.mjs";

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing uses data.
 */
export default class UsesField extends SchemaField {
	constructor(fields={}, options={}) {
		fields = {
			spent: new NumberField({initial: 0, integer: true, label: "BF.Uses.Spent.Label"}),
			min: new FormulaField({deterministic: true, label: "BF.Uses.Minimum.Label"}),
			max: new FormulaField({deterministic: true, label: "BF.Uses.Maximum.Label"}),
			recovery: new ArrayField(new SchemaField({
				period: new StringField({initial: "longRest", label: "BF.Recovery.Period.Label"}),
				type: new StringField({initial: "recoverAll", label: "BF.Recovery.Type.Label"}),
				formula: new FormulaField({label: "BF.Recovery.Formula.Label"})
			}), {label: "BF.Recovery.Label"}),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => !v ? delete fields[k] : null);
		super(fields, { label: "BF.Uses.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	initialize(value, model, options={}) {
		const obj = super.initialize(value, model, options);

		const existingPeriods = new Set(obj.recovery.map(r => r.period));

		for ( const recovery of obj.recovery ) {
			Object.defineProperty(recovery, "validPeriods", {
				get() {
					return Object.entries(CONFIG.BlackFlag.recoveryPeriods).map(([key, config]) => ({
						key, label: config.label, disabled: existingPeriods.has(key) && (this.period !== key)
					}));
				},
				configurable: true,
				enumerable: false
			});
		}

		return obj;
	}
}
