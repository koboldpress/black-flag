import { getPluralRules, numberFormat } from "../../utils/_module.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing information about a spell's casting time or activity's activation.
 *
 * @property {string} value - Activation value.
 * @property {string} units - Units used to measure the activation.
 * @property {string} special - Condition required to trigger activation.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class ActivationField extends SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			value: new NumberField({ min: 0, integer: true, label: "BF.Activation.Cost.Label" }),
			type: new StringField({ label: "BF.Activation.Type.Label" }),
			condition: new StringField({ label: "BF.Activation.Condition.Label" }),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, { label: "BF.Activation.Label", ...options });
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
				const type = CONFIG.BlackFlag.activationOptions({
					pluralRule: getPluralRules().select(this.value ?? 1)
				}).get(this.type);
				let label = game.i18n.format("BF.Activation.Scalar.Label", {
					number: numberFormat(this.value ?? 1),
					type: type.label
				});
				if (this.condition) label = `<span data-tooltip="${this.condition.capitalize()}">${label}*</span>`;
				return label;
			},
			enumerable: false
		});

		return obj;
	}
}
