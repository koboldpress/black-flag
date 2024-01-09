import BaseDataModel from "../abstract/base-data-model.mjs";
import FormulaField from "./formula-field.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing uses data.
 */
export default class UsesField extends SchemaField {
	constructor(fields={}, options={}) {
		super(BaseDataModel.mergeSchema({
			spent: new NumberField({initial: 0, integer: true, label: "BF.Uses.Spent.Label"}),
			min: new FormulaField({deterministic: true, label: "BF.Uses.Minimum.Label"}),
			max: new FormulaField({deterministic: true, label: "BF.Uses.Maximum.Label"}),
			consumeQuantity: new BooleanField({label: "BF.Uses.ConsumeQuantity.Label", hint: "BF.Uses.ConsumeQuantity.Hint"}),
			recovery: new ArrayField(new SchemaField({
				period: new StringField({initial: "longRest", label: "BF.Recovery.Period.Label"}),
				type: new StringField({initial: "recoverAll", label: "BF.Recovery.Type.Label"}),
				formula: new FormulaField({label: "BF.Recovery.Formula.Label"})
			}), {label: "BF.Recovery.Label"})
		}, fields), { label: "BF.Uses.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	initialize(value, model, options={}) {
		const obj = super.initialize(value, model, options);

		Object.defineProperty(obj, "hasUses", {
			get() {
				return !!this.min || !!this.max;
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(obj, "supportsConsumeQuantity", {
			value: Object.hasOwn(obj, "consumeQuantity"),
			enumerable: false,
			writable: false
		});

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

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine usage recovery for the provided usage data.
	 * @param {string[]} periods - Recovery periods to apply. Will execute the first one found in recovery configurations.
	 * @param {object} data - Usage data from a UsesField.
	 * @param {object} rollData - Roll data to use when evaluating recovery formulas.
	 * @returns {{updates: object, rolls: []}|false}
	 */
	static async recoverUses(periods, data, rollData) {
		if ( !data.recovery.length ) return false;
		const matchingPeriod = periods.find(p => data.recovery.find(r => r.period === p));
		const recoveryProfile = data.recovery.find(r => r.period === matchingPeriod);
		if ( !recoveryProfile ) return false;

		const updates = {};
		const rolls = [];
		if ( recoveryProfile.type === "recoverAll" ) updates.spent = 0;
		else if ( recoveryProfile.type === "loseAll" ) updates.spent = data.max ? data.max : -data.min;
		else if ( recoveryProfile.formula ) {
			const roll = new CONFIG.Dice.BaseRoll(recoveryProfile.formula, rollData);
			await roll.evaluate();
			updates.spent = Math.clamped(data.spent - roll.total, 0, data.max - data.min);
			if ( !roll.isDeterministic ) rolls.push(roll);
		}

		return { updates, rolls };
	}
}
