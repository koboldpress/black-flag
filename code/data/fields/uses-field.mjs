import FormulaField from "./formula-field.mjs";

const { ArrayField, BooleanField, EmbeddedDataField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing uses data.
 */
export default class UsesField extends EmbeddedDataField {
	constructor(options = {}) {
		super(UsesData, foundry.utils.mergeObject({ label: "BF.Uses.Label" }, options));
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

export class UsesData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			spent: new NumberField({ initial: 0, integer: true, label: "BF.Uses.Spent.Label" }),
			min: new FormulaField({ deterministic: true, label: "BF.Uses.Minimum.Label" }),
			max: new FormulaField({ deterministic: true, label: "BF.Uses.Maximum.Label" }),
			consumeQuantity: new BooleanField({
				label: "BF.Uses.ConsumeQuantity.Label",
				hint: "BF.Uses.ConsumeQuantity.Hint"
			}),
			recovery: new ArrayField(
				new SchemaField({
					period: new StringField({ initial: "longRest", label: "BF.Recovery.Period.Label" }),
					type: new StringField({ initial: "recoverAll", label: "BF.Recovery.Type.Label" }),
					formula: new FormulaField({ label: "BF.Recovery.Formula.Label" })
				}),
				{ label: "BF.Recovery.Label" }
			)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is there a range of possible uses defined?
	 * @type {boolean}
	 */
	get hasUses() {
		return !!this.min || !this.max;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can an item's quantity be consumed as part of the usage consumption?
	 * @type {boolean}
	 */
	get supportsConsumeQuantity() {
		return this.options.consumeQuantity !== false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare uses data.
	 */
	prepareData() {
		const existingPeriods = new Set(this.recovery.map(r => r.period));
		for (const recovery of this.recovery) {
			Object.defineProperty(recovery, "validPeriods", {
				get() {
					return Object.entries(CONFIG.BlackFlag.recoveryPeriods).map(([key, config]) => ({
						key,
						label: config.label,
						disabled: existingPeriods.has(key) && this.period !== key
					}));
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(recovery, "recharge", {
				get() {
					return {
						disabled: existingPeriods.has("recharge") && this.period !== "recharge",
						options: [
							...Array.fromRange(4, 2).map(min => ({
								key: min,
								label: game.i18n.format("BF.Recovery.Recharge.Range", { min })
							})),
							{ key: 6, label: game.i18n.localize("BF.Recovery.Recharge.Single") }
						].reverse()
					};
				},
				configurable: true,
				enumerable: false
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine usage recovery for this usage.
	 * @param {string[]} periods - Recovery periods to apply. Will execute the first one found in recovery configurations.
	 * @param {object} rollData - Roll data to use when evaluating recovery formulas.
	 * @returns {{updates: object, rolls: []}|false}
	 */
	async recoverUses(periods, rollData) {
		if (!this.recovery.length) return false;
		const matchingPeriod = periods.find(p => this.recovery.find(r => r.period === p));
		const recoveryProfile = this.recovery.find(r => r.period === matchingPeriod);
		if (!recoveryProfile) return false;

		const updates = {};
		const rolls = [];
		if (recoveryProfile.type === "recoverAll") updates.spent = 0;
		else if (recoveryProfile.type === "loseAll") updates.spent = this.max ? this.max : -this.min;
		else if (recoveryProfile.formula) {
			const roll = new CONFIG.Dice.BasicRoll(recoveryProfile.formula, rollData);
			await roll.evaluate();
			updates.spent = Math.clamped(this.spent - roll.total, 0, this.max - this.min);
			if (!roll.isDeterministic) rolls.push(roll);
		}

		return { updates, rolls };
	}
}
