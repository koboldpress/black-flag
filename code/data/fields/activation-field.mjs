import { formatTime, getPluralRules, numberFormat } from "../../utils/_module.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing information about a spell's casting time or activity's activation.
 *
 * @property {string} value - Activation value.
 * @property {string} units - Units used to measure the activation.
 * @property {string} condition - Condition required to trigger activation.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class ActivationField extends SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			value: new NumberField({ min: 0, integer: true }),
			type: new StringField(),
			condition: new StringField(),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, options);
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		const obj = super.initialize(value, model, options);

		Object.defineProperty(obj, "category", {
			get() {
				if (this.type in CONFIG.BlackFlag.actionTypes.standard.children) {
					return "standard";
				} else if (this.type in CONFIG.BlackFlag.actionTypes.monster.children) {
					return "monster";
				} else if (this.type in CONFIG.BlackFlag.timeUnits.time.children) {
					return "time";
				}
				return null;
			},
			enumerable: false
		});

		Object.defineProperty(obj, "label", {
			get() {
				return ActivationField.label(obj);
			},
			enumerable: false
		});
		Object.defineProperty(obj, "embedLabel", {
			get() {
				return ActivationField.label(obj, { style: "long" });
			},
			enumerable: false
		});

		return obj;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Labels                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a label describing the activation.
	 * @param {TargetField} data - Data from the activation field.
	 * @param {object} [options={}]
	 * @param {string} [options.style="combined"] - Long or combined.
	 * @returns {string}
	 */
	static label(data, { style = "combined" } = {}) {
		let label;
		if (data.type in CONFIG.BlackFlag.timeUnits.time.children) {
			label = formatTime(data.value, data.type);
		} else {
			const type = CONFIG.BlackFlag.activationOptions({
				pluralRule: getPluralRules().select(data.value ?? 1)
			}).get(data.type);
			if (!type) return "";

			label = game.i18n.format("BF.ACTIVATION.Formatted.Scalar", {
				number: numberFormat(data.value ?? 1),
				type: type.label,
				typeLowercase: type.label.toLowerCase()
			});
		}

		if (style === "combined") {
			return `<span${data.condition ? ` data-tooltip="${data.condition.capitalize()}"` : ""}>${label}</span>`;
		} else if (data.condition) {
			return game.i18n.format("BF.ACTIVATION.Formatted.Condition", {
				activation: label,
				condition: data.condition
			});
		}

		return label;
	}
}
