import { formatNumber, formatTime } from "../../utils/_module.mjs";
import FormulaField from "./formula-field.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing information about a item or activity's duration.
 *
 * @property {string} value - Duration value.
 * @property {string} unit - Units used to measure the duration.
 * @property {string} special - Description of the duration if unit is `special`.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class DurationField extends SchemaField {
	constructor(fields = {}, options = {}, context = {}) {
		fields = {
			value: new FormulaField({ deterministic: true, label: "BF.DURATION.FIELDS.duration.value.label" }),
			unit: new StringField({
				required: true,
				blank: false,
				initial: "instantaneous",
				label: "BF.DURATION.FIELDS.duration.unit.label"
			}),
			special: new StringField({ label: "BF.DURATION.FIELDS.duration.special.label" }),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, options, context);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		const obj = super.initialize(value, model, options);
		const isSpell = model.isSpell || model.parent?.type === "spell";

		Object.defineProperty(obj, "scalar", {
			get() {
				return this.unit ? !!CONFIG.BlackFlag.durationOptions({ isSpell }).get(this.unit)?.scalar : false;
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(obj, "label", {
			get() {
				if (this.unit in CONFIG.BlackFlag.timeUnits.localized) {
					return formatTime(this.value, this.unit);
				} else {
					const unit = CONFIG.BlackFlag.durationOptions({ pluralCount: this.value, isSpell }).get(this.unit);
					if (unit?.scalar) {
						if (!this.value) return null;
						return formatNumber(this.value, { unit });
					}
					return unit?.label ?? "";
				}
			},
			configurable: true,
			enumerable: false
		});

		return obj;
	}
}
