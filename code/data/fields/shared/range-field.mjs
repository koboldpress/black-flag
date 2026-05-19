import { formatDistance } from "../../../utils/_module.mjs";
import FormulaField from "../formula-field.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing information about an item or activity's range.
 *
 * @property {string} value - Standard range.
 * @property {string} unit - Unit used to measure the range.
 * @property {string} special - Description of the range if unit is `special`.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class RangeField extends SchemaField {
	constructor(fields = {}, options = {}, context = {}) {
		fields = {
			value: new FormulaField({ deterministic: true }),
			unit: new StringField(),
			special: new StringField(),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, options, context);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		const obj = super.initialize(value, model, options);

		Object.defineProperty(obj, "scalar", {
			get() {
				return this.unit in CONFIG.BlackFlag.distanceUnits;
			},
			enumerable: false
		});

		Object.defineProperty(obj, "label", {
			get() {
				if (this.scalar) return this.value ? formatDistance(this.value, this.unit) : null;
				else {
					const type = CONFIG.BlackFlag.rangeTypes[this.unit];
					if (!type) return "";
					let label = game.i18n.localize(type.label);
					if (this.unit === "special" && this.special) {
						label = `<span data-tooltip="${this.special}">${label}*</span>`;
					}
					return label;
				}
			},
			enumerable: false
		});

		return obj;
	}
}
