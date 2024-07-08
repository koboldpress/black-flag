import { getPluralRules, numberFormat } from "../../utils/_module.mjs";
import FormulaField from "./formula-field.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing information about a item or activity's duration.
 *
 * @property {string} value - Duration value.
 * @property {string} units - Units used to measure the duration.
 * @property {string} special - Description of the duration if units is `special`.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class DurationField extends SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			value: new FormulaField({ deterministic: true, label: "BF.Duration.Value.Label" }),
			units: new StringField({ initial: "instantaneous", label: "BF.Duration.Type.Label" }),
			special: new StringField({ label: "BF.Duration.Special" }),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, { label: "BF.Duration.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		const obj = super.initialize(value, model, options);
		const isSpell = model.isSpell || model.parent?.type === "spell";

		Object.defineProperty(obj, "scalar", {
			get() {
				return this.units ? !!CONFIG.BlackFlag.durationOptions({ isSpell }).get(this.units)?.scalar : false;
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(obj, "label", {
			get() {
				const unit = CONFIG.BlackFlag.durationOptions({
					pluralRule: getPluralRules().select(this.value),
					isSpell
				}).get(this.units);
				if (unit?.scalar) {
					if (!this.value) return null;
					return numberFormat(this.value, { unit });
				}
				return unit?.label ?? "";
			},
			configurable: true,
			enumerable: false
		});

		return obj;
	}
}
