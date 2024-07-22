import FormulaField from "./formula-field.mjs";

const { BooleanField, EmbeddedDataField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

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
 *
 * @property {number} number - Number of dice to roll.
 * @property {number} denomination - Die denomination to roll.
 * @property {string} type - Damage type.
 * @property {Set<string>} additionalTypes - If damage type is "variable", damage types that can be chosen.
 */
export class SimpleDamageData extends foundry.abstract.DataModel {
	/** @override */
	static defineSchema() {
		return {
			number: new NumberField({ min: 0, integer: true, label: "BF.Die.Number.Label" }),
			denomination: new NumberField({ min: 0, integer: true, label: "BF.Die.Denomination.Label" }),
			type: new StringField({ label: "BF.Damage.Type.Label" }),
			additionalTypes: new SetField(new StringField(), { required: false })
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
 *
 * @property {string} bonus - Bonus added to the damage.
 * @property {object} custom
 * @property {boolean} custom.enabled - Should the custom formula be used?
 * @property {string} custom.formula - Custom damage formula.
 * @property {object} scaling
 * @property {string} scaling.mode - How the damage scales in relation with levels.
 * @property {number} scaling.number - Number of dice to add per scaling level.
 * @property {string} scaling.formula - Arbitrary scaling formula which will be multiplied by scaling increase.
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
			if (this.custom?.enabled) {
				formula = formula.replace(/^(\d)+d/, (match, number) => `${Number(number) + this.scaling.number * increase}d`);
			} else if (this.denomination) {
				formula = `${this.number + this.scaling.number * increase}d${this.denomination}`;
				if (this.bonus) formula = `${formula} + ${this.bonus}`;
			}
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
