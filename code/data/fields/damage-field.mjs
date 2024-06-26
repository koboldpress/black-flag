import FormulaField from "./formula-field.mjs";

const { BooleanField, EmbeddedDataField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing damage data.
 */
export default class DamageField extends EmbeddedDataField {
	constructor({ simple = false, ...options } = {}) {
		super(simple ? SimpleDamageData : ExtendedDamageData, { label: "BF.Damage.Label", ...options });
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Simple version of damage data used in weapons with just the die count, denomination, and damage type.
 */
export class SimpleDamageData extends foundry.abstract.DataModel {
	/** @override */
	static defineSchema() {
		return {
			number: new NumberField({ min: 0, integer: true, label: "BF.Die.Number.Label" }),
			denomination: new NumberField({ min: 0, integer: true, label: "BF.Die.Denomination.Label" }),
			type: new StringField({ label: "BF.Damage.Type.Label" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Formula for this damage.
	 * @type {string}
	 */
	get formula() {
		return this.number && this.denomination ? `${this.number}d${this.denomination}` : "";
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Extended version of damage data used in activities with support for bonuses, custom formulas, and scaling.
 */
export class ExtendedDamageData extends SimpleDamageData {
	/** @override */
	static defineSchema() {
		return {
			...super.defineSchema(),
			bonus: new FormulaField({ label: "BF.Damage.Bonus.Label" }),
			custom: new SchemaField(
				{
					enabled: new BooleanField(),
					formula: new FormulaField({ label: "BF.Formula.Custom.Label" })
				},
				{ required: false }
				// TODO: Figure out why "required: false" is needed here to avoid issues with HealingActivity
			),
			scaling: new SchemaField(
				{
					mode: new StringField({ label: "BF.Damage.Scaling.Mode.Label" }),
					number: new NumberField({ initial: 1, min: 0, integer: true, label: "BF.Damage.Scaling.Dice.Label" }),
					formula: new FormulaField()
				},
				{ required: false }
			)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get formula() {
		if (this.custom?.enabled) return this.custom?.formula ?? "";
		const formula = super.formula;
		return formula ? (this.bonus ? `${formula} + ${this.bonus}` : formula) : this.bonus;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Scale the damage by a certain amount using its built-in scaling configuration.
	 * @param {number} increase - Number of steps above base damage to scale.
	 * @returns {string}
	 */
	scaledFormula(increase) {
		let formula = this.formula;
		switch (this.scaling?.mode) {
			case "whole":
				break;
			case "half":
				increase = Math.floor(increase * 0.5);
			default:
				return formula;
		}
		if (!increase) return formula;

		// If dice count scaling, increase the count on the first die rolled
		if (this.scaling?.number) {
			formula = formula.replace(/^(\d)+d/, (match, number) => `${Number(number) + this.scaling.number * increase}d`);
		}

		// If custom scaling included, modify to match increase and append for formula
		if (this.scaling?.formula) {
			let roll = new Roll(this.scaling.formula);
			roll = roll.alter(increase, 0, { multiplyNumeric: true });
			formula = formula ? `${formula} + ${roll.formula}` : roll.formula;
		}

		return formula;
	}
}
