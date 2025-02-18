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

/**
 * Data for a recovery profile for an activity's uses.
 *
 * @typedef {object} UsesRecoveryData
 * @property {string} period   Period at which this profile is activated.
 * @property {string} type     Whether uses are reset to full, reset to zero, or recover a certain number of uses.
 * @property {string} formula  Formula used to determine recovery if type is not reset.
 */

/**
 * Data for uses on an item or activity.
 *
 * @property {number} spent                 Number of uses that have been spent.
 * @property {string} max                   Formula for the maximum number of uses.
 * @property {boolean} consumeQuantity      For items with quantity, should the quantity be reduced if all uses spent?
 * @property {UsesRecoveryData[]} recovery  Recovery profiles for this activity's uses.
 */
export class UsesData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			spent: new NumberField({ initial: 0, integer: true, label: "BF.Uses.Spent.Label" }),
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
		return !!this._source.max || !!this.max;
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
	 * @param {object} rollData
	 */
	prepareData(rollData) {
		const existingPeriods = new Set(this.recovery.map(r => r.period));
		for (const recovery of this.recovery) {
			if (recovery.period === "recharge") recovery.type = "recoverAll";
			Object.defineProperty(recovery, "validPeriods", {
				get() {
					return Object.entries(CONFIG.BlackFlag.recoveryPeriods).map(([value, config]) => ({
						disabled: existingPeriods.has(value) && this.period !== value,
						group: game.i18n.localize(config.group),
						label: game.i18n.localize(config.label),
						value
					}));
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(recovery, "periodOptions", {
				get() {
					return [
						...this.validPeriods,
						{ rule: true },
						{
							value: "recharge",
							label: game.i18n.localize("BF.Recovery.Recharge.Label"),
							disabled: this.recharge.disabled
						},
						{ value: "@scale.", label: game.i18n.localize("BF.Advancement.ScaleValue.Title") }
					];
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

			Object.defineProperty(recovery, "isScaleValue", {
				value: recovery.period.startsWith("@scale"),
				configurable: true,
				enumerable: false
			});
			if (recovery.isScaleValue) {
				const scaleValue = foundry.utils.getProperty(rollData, recovery.period.replace("@", ""));
				if (scaleValue?.per) recovery.period = scaleValue.per;
			}
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
		if (periods.includes("round")) periods.unshift("recharge");
		const matchingPeriod = periods.find(p => this.recovery.find(r => r.period === p));
		const recoveryProfile = this.recovery.find(r => r.period === matchingPeriod);
		if (!recoveryProfile) return false;

		const updates = {};
		const rolls = [];

		// If recharge period, then roll to see if it actually recovers
		if (matchingPeriod === "recharge") {
			if (this.spent === 0) return false;
			rolls.push(await this.rollRecharge(Number(recoveryProfile.formula)));
			if (!rolls[0]) return false;
		}

		if (recoveryProfile.type === "recoverAll") updates.spent = 0;
		else if (recoveryProfile.type === "loseAll") updates.spent = this.max ? this.max : 0;
		else if (recoveryProfile.formula) {
			const delta =
				this.parent instanceof BlackFlag.documents.activity.Activity
					? { item: this.parent.item.id, keyPath: `system.activities.${this.parent.id}.uses.spent` }
					: { item: this.parent.parent.id, keyPath: "system.uses.spent" };
			console.log(delta);
			const roll = new CONFIG.Dice.BasicRoll(recoveryProfile.formula, rollData, { delta });
			await roll.evaluate();
			const newSpent = Math.clamp(this.spent - roll.total, 0, this.max);
			if (newSpent !== this.spent) {
				updates.spent = newSpent;
				if (!roll.isDeterministic) rolls.push(roll);
			}
		}

		return { updates, rolls };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Make a recharge roll to see if uses are recovered.
	 * @param {number} target - Target value necessary to success.
	 * @returns {BasicRoll|false}
	 */
	async rollRecharge(target) {
		const rollConfig = {
			rolls: [{ parts: ["1d6"], options: { target } }],
			origin: this.parent
		};

		const type = game.i18n.localize("BF.Recovery.Recharge.Label");
		const dialogConfig = {
			configure: false,
			options: {
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
			}
		};

		const flavor = game.i18n.format("BF.Roll.Type.Label", { type });
		const messageConfig = {
			data: {
				flavor,
				"flags.black-flag.roll": {
					type: "recharge"
				}
			}
		};

		/**
		 * A hook event that fires before recharge is rolled.
		 * @function blackFlag.preRollRecharge
		 * @memberof hookEvents
		 * @param {BlackFlagItem|Activity} source - Item or activity for which uses are being recovered.
		 * @param {HitDieRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollRecharge", this.parent, rollConfig, dialogConfig, messageConfig) === false) {
			return false;
		}

		const rolls = await CONFIG.Dice.BasicRoll.build(rollConfig, dialogConfig, messageConfig);

		/**
		 * A hook event that fires after a recharge roll has been performed.
		 * @function blackFlag.rollRecharge
		 * @memberof hookEvents
		 * @param {BlackFlagItem|Activity} source - Item or activity for which uses are being recovered.
		 * @param {BasicRoll[]} rolls - The resulting rolls.
		 */
		Hooks.callAll("blackFlag.rollRecharge", this.parent, rolls);

		return rolls[0]?.isSuccess ? rolls[0] : false;
	}
}
