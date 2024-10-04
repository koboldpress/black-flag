import { numberFormat } from "../../../utils/_module.mjs";
import FormulaField from "../../fields/formula-field.mjs";

const { ArrayField, EmbeddedDataField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for holding one or more consumption targets.
 */
export default class ConsumptionTargetsField extends ArrayField {
	constructor(options = {}) {
		super(new EmbeddedDataField(ConsumptionTargetData), options);
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Data model for consumption targets.
 *
 * @property {string} type             Type of consumption (e.g. activity uses, item uses, hit die, spell slot).
 * @property {string} target           Target of the consumption depending on the selected type (e.g. item's ID, hit
 *                                     die denomination, spell slot circle).
 * @property {string} value            Formula that determines amount consumed or recovered.
 * @property {object} scaling
 * @property {string} scaling.mode     Scaling mode (e.g. no scaling, scale target amount, scale spell circle).
 * @property {string} scaling.formula  Specific scaling formula if not automatically calculated from target's value.
 */
export class ConsumptionTargetData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new StringField({ label: "BF.Consumption.Type.Label" }),
			target: new StringField({ label: "BF.Consumption.Target.Label" }),
			value: new FormulaField({ initial: "1", label: "BF.Consumption.Amount.Label" }),
			scaling: new SchemaField({
				mode: new StringField({ label: "BF.DAMAGE.Scaling.Mode.Label" }),
				formula: new FormulaField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Activity to which this consumption target belongs.
	 * @type {Activity}
	 */
	get activity() {
		return this.parent;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor containing this consumption target, if embedded.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.activity.actor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item to which this consumption target's activity belongs.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.activity.item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Method of scaling this consumption.
	 * @type {Record<string, string>|null}
	 */
	get scalingModes() {
		if (!CONFIG.BlackFlag.consumptionTypes[this.type]?.scalingModes) return null;
		return Object.entries(CONFIG.BlackFlag.consumptionTypes[this.type].scalingModes).reduce((obj, [k, { label }]) => {
			obj[k] = label;
			return obj;
		}, {});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should the target section be shown?
	 * @type {boolean}
	 */
	get showTargets() {
		return "validTargets" in CONFIG.BlackFlag.consumptionTypes[this.type];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of valid targets within the current context.
	 * @type {{key: string, label: string}[]|null}
	 */
	get validTargets() {
		return this.constructor.getValidTargets(this.type, this.parent);
	}

	/**
	 * List of valid targets for a specific type.
	 * @param {string} type - Consumption type.
	 * @param {Activity} activity - Activity that contains the target.
	 * @returns {{key: string, label: string}[]|null}
	 */
	static getValidTargets(type, activity) {
		const config = CONFIG.BlackFlag.consumptionTypes[type];
		if (!config?.validTargets || (!activity.item?.isEmbedded && config.targetRequiresEmbedded === true)) return null;
		return config.validTargets.call(activity);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine which consumption types can be selected.
	 * @type {{key: string, label: string, disabled: boolean}[]}
	 */
	get validTypes() {
		const existingTypes = new Set(this.parent.consumption.targets.map(t => t.type));
		return this.parent.item.system._validConsumptionTypes(
			Object.entries(CONFIG.BlackFlag.consumptionTypes).map(([key, config]) => ({
				key,
				label: config.label,
				disabled: existingTypes.has(key) && this.type !== key
			}))
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Consumption              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform consumption according to the target type.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 * @throws ConsumptionError
	 */
	async consume(config, updates) {
		const typeConfig = CONFIG.BlackFlag.consumptionTypes[this.type];
		if (!typeConfig?.consume) throw new Error(`Consumption type ${this.type} does not have a consume method defined.`);
		await typeConfig.consume.call(this, config, updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates for activity uses consumption.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	static async consumeActivityUses(config, updates) {
		const result = await this._usesConsumption(config, {
			uses: this.activity.uses,
			type: game.i18n.format("BF.Consumption.Type.ActivityUses.Warning", {
				itemName: this.item.name,
				activityName: this.activity.name
			}),
			rolls: updates.rolls
		});
		if (result) foundry.utils.mergeObject(updates.activity, { "uses.spent": result.spent });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates for hit dice consumption.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	static async consumeHitDice(config, updates) {
		const cost = (await this.resolveCost({ config, rolls: updates.rolls })).total;

		const availableDenominations = Object.entries(this.actor.system.attributes.hd.d);
		if (this.target === "smallest") availableDenominations.sort((lhs, rhs) => lhs[0] - rhs[0]);
		else if (this.target === "largest") availableDenominations.sort((lhs, rhs) => rhs[0] - lhs[0]);
		else {
			const denom = this.actor.system.attributes.hd.d[this.target];

			let warningMessage;
			if (!denom) warningMessage = "BF.Consumption.Warning.MissingHitDice";
			else if (denom.available === 0 && cost > 0) warningMessage = "BF.Consumption.Warning.None";
			else if (denom.available < cost) warningMessage = "BF.Consumption.Warning.NotEnough";
			if (warningMessage) {
				const denomination = `d${this.target}`;
				throw new ConsumptionError(
					game.i18n.format(warningMessage, {
						type: game.i18n.format("BF.Consumption.Type.HitDice.Warning", { denomination }),
						denomination,
						cost: numberFormat(cost, { spelledOut: true }),
						available: numberFormat(denom?.value, { spelledOut: true })
					})
				);
			}

			if (cost < 0 && !denom.spent) return;
			updates.actor[`system.attributes.hd.d.${this.target}.spent`] = Math.clamp(denom.spent + cost, 0, denom.max);
			return;
		}

		// Loop over available denominations, subtracting or adding cost until it is all spent
		let remaining = cost;
		for (const [d, denom] of availableDenominations) {
			const delta = remaining > 0 ? Math.min(remaining, denom.available) : Math.max(remaining, -denom.spent);
			if (delta !== 0) {
				updates.actor[`system.attributes.hd.d.${d}.spent`] = denom.spent + delta;
				remaining -= delta;
			}
			if (remaining === 0) return;
		}
		if (remaining > 0) {
			const available = Object.values(this.actor.system.attributes.hd.d).reduce((sum, d) => sum + d.available, 0);
			const warningMessage = `BF.Consumption.Warning.${available > 0 ? "NotEnough" : "None"}`;
			throw new ConsumptionError(
				game.i18n.format(warningMessage, {
					type: game.i18n.localize("BF.HitDie.Label[other]").toLowerCase(),
					cost: numberFormat(cost, { spelledOut: true }),
					available: numberFormat(available, { spelledOut: true })
				})
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates for item uses consumption.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	static async consumeItemUses(config, updates) {
		const item = this.target ? this.actor.items.get(this.target) : this.item;
		if (!item) throw new Error("item not found");

		const result = await this._usesConsumption(config, {
			uses: item.system.uses,
			quantity: item.system.quantity ?? 1,
			type: game.i18n.format("BF.Consumption.Type.ItemUses.Warning", { name: item.name }),
			rolls: updates.rolls
		});
		if (!result) return;

		const update = { "system.uses.spent": result.spent };
		if (item.system.uses.consumeQuantity) update["system.quantity"] = result.quantity;

		const itemIndex = updates.item.findIndex(i => i._id === item.id);
		if (itemIndex === -1) updates.item.push({ _id: item.id, ...update });
		else foundry.utils.mergeObject(updates.item[itemIndex], update);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates for spell slot consumption.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	static async consumeSpellSlots(config, updates) {
		const cost = (await this.resolveCost({ config, rolls: updates.rolls })).total;
		const circleNumber = Math.clamp(
			this.resolveCircle({ config, rolls: updates.rolls }),
			1,
			CONFIG.BlackFlag.maxSpellCircle
		);

		// Check to see if enough slots are available at specified circle
		const circleData = this.actor.system.spellcasting?.slots?.[`circle-${circleNumber}`];
		const newSpent = (circleData?.spent ?? 0) + cost;
		let warningMessage;
		if (!circleData?.max) warningMessage = "BF.Consumption.Warning.MissingSpellCircle";
		else if (cost > 0 && !circleData.value) warningMessage = "BF.Consumption.Warning.None";
		else if (newSpent > circleData.max) warningMessage = "BF.Consumption.Warning.NotEnough";
		if (warningMessage) {
			const circle = CONFIG.BlackFlag.spellCircles()[circleNumber].toLowerCase();
			const type = game.i18n.format("BF.Consumption.Type.SpellSlots.Warning", { circle });
			throw new ConsumptionError(
				game.i18n.format(warningMessage, {
					type,
					circle,
					cost: numberFormat(cost, { spelledOut: true }),
					available: numberFormat(circleData?.value, { spelledOut: true })
				})
			);
		}

		if (cost < 0 && !circleData.spent) return;
		updates.actor[`system.spellcasting.slots.circle-${circleNumber}.spent`] = Math.clamp(newSpent, 0, circleData.max);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate uses updates.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {object} options
	 * @param {object} options.uses - Uses object on an Item or Activity.
	 * @param {string} options.type - Type property that will be provided to warning messages.
	 * @param {Roll[]} options.rolls - Rolls performed as part of the activation.
	 * @param {number} [options.quantity] - Item quantity, for when `consumeQuantity` is `true`.
	 * @returns {{spent: number, quantity: number}|null} - New spent uses & quantity values, or `null` for no change.
	 * @internal
	 */
	async _usesConsumption(config, { uses, type, rolls, quantity }) {
		const cost = (await this.resolveCost({ config, rolls })).total;

		let availableUses = uses.value;
		const canConsumeQuantity = uses.consumeQuantity && quantity && cost > 0;
		if (canConsumeQuantity) availableUses += quantity * (uses.max || 1);

		let warningMessage;
		if (cost > 0 && !availableUses) warningMessage = "BF.Consumption.Warning.None";
		else if (cost > availableUses) warningMessage = "BF.Consumption.Warning.NotEnough";
		if (warningMessage)
			throw new ConsumptionError(
				game.i18n.format(warningMessage, {
					type,
					cost: numberFormat(cost, { spelledOut: true }),
					available: numberFormat(availableUses, { spelledOut: true })
				})
			);

		// No need to adjust quantity
		if (!canConsumeQuantity || cost < uses.value) return { spent: uses.spent + cost, quantity };

		let remainingCost = cost - uses.value;
		let deltaQuantity = 1;
		while (remainingCost > uses.max) {
			remainingCost -= uses.max;
			deltaQuantity += 1;
		}
		return { spent: remainingCost, quantity: quantity - deltaQuantity };
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Consumption Labels         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Valid Targets            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a list of targets for the "Hit Dice" consumption type.
	 * @this {ConsumptionTargetData}
	 * @returns {FormSelectOption[]}
	 */
	static validHitDiceTargets() {
		return [
			{ value: "smallest", label: game.i18n.localize("BF.Consumption.Type.HitDice.Smallest") },
			...CONFIG.BlackFlag.hitDieSizes.map(d => ({ value: d, label: `d${d}` })),
			{ value: "largest", label: game.i18n.localize("BF.Consumption.Type.HitDice.Largest") }
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a list of targets for the "Item Uses" consumption type.
	 * @this {ConsumptionTargetData}
	 * @returns {FormSelectOption[]}
	 */
	static validItemUsesTargets() {
		const makeLabel = (name, item) => {
			let label;
			const uses = item.system.uses;
			if (
				uses.max &&
				uses.recovery?.length === 1 &&
				uses.recovery[0].type === "recoverAll" &&
				uses.recovery[0].period !== "recharge"
			) {
				const period = CONFIG.BlackFlag.recoveryPeriods.localizedAbbreviations[uses.recovery[0].period];
				label = game.i18n.format("BF.CONSUMPTION.Uses.Available.Period", { max: numberFormat(uses.max), period });
			} else label = game.i18n.format("BF.CONSUMPTION.Uses.Available.Charges", { value: numberFormat(uses.value) });
			return `${name} (${label})`;
		};
		return [
			{ value: "", label: makeLabel(game.i18n.localize("BF.Consumption.Type.ItemUses.ThisItem"), this.item) },
			{ rule: true },
			...(this.actor?.items ?? [])
				.filter(i => i.system.uses?.max && i !== this.item)
				.map(i => ({ value: i.id, label: makeLabel(i.name, i) }))
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a list of targets for the "Spell Slots" consumption type.
	 * @this {ConsumptionTargetData}
	 * @returns {FormSelectOption[]}
	 */
	static validSpellSlotsTargets() {
		return Object.entries(CONFIG.BlackFlag.spellCircles()).reduce((arr, [value, label]) => {
			if (value !== "0") arr.push({ value, label });
			return arr;
		}, []);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve the spell circle to consume, taking scaling into account.
	 * @param {object} [options={}]
	 * @param {ActivityActivationConfiguration} [options.config={}] - Configuration info for the activation.
	 * @param {BasicRoll[]} [options.rolls] - Rolls performed as part of the activation.
	 * @returns {number}
	 */
	resolveCircle({ config = {}, ...options } = {}) {
		const roll = this._resolveScaledRoll(this.target, this.scaling.mode === "circle" ? config.scaling ?? 0 : 0, {
			...options,
			evaluate: false
		});
		roll.evaluateSync();
		return roll.total;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve the provided cost formula as a dice roll.
	 * @param {object} [options={}]
	 * @param {ActivityActivationConfiguration} [options.config={}] - Configuration info for the activation.
	 * @param {boolean} [options.evaluate=true] - Should the cost roll be evaluated?
	 * @param {BasicRoll[]} [options.rolls] - Rolls performed as part of the activation.
	 * @returns {Promise<BasicRoll>|BasicRoll}
	 */
	resolveCost({ config = {}, ...options } = {}) {
		return this._resolveScaledRoll(this.value, this.scaling.mode === "amount" ? config.scaling ?? 0 : 0, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve a scaling consumption value.
	 * @param {string} formula - Formula for the initial value.
	 * @param {number} scaling - Amount to scale the formula.
	 * @param {object} [options={}]
	 * @param {boolean} [options.evaluate=true] - Should the roll be evaluated?
	 * @param {BasicRoll[]} [options.rolls] - Rolls performed as part of the activation.
	 * @returns {Promise<BasicRoll>|BasicRoll}
	 * @internal
	 */
	_resolveScaledRoll(formula, scaling, { evaluate = true, rolls } = {}) {
		const rollData = this.parent.item.getRollData();
		const roll = new CONFIG.Dice.BasicRoll(formula, rollData);

		if (scaling) {
			// If a scaling formula is provided, multiply it and add to the end of the initial formula
			if (this.scaling.formula) {
				const scalingRoll = new Roll(this.scaling.formula, rollData);
				scalingRoll.alter(scaling, undefined, { multiplyNumeric: true });
				roll.terms.push(new foundry.dice.terms.OperatorTerm({ operator: "+" }), ...scalingRoll.terms);
			}

			// Otherwise increase the number of dice and the numeric term for each scaling step
			else {
				roll.terms = roll.terms.map(term => {
					if (term instanceof foundry.dice.terms.DiceTerm) return term.alter(undefined, scaling);
					else if (term instanceof foundry.dice.terms.NumericTerm) term.number += scaling;
					return term;
				});
			}

			roll.resetFormula();
		}

		if (evaluate)
			return roll.evaluate().then(roll => {
				if (rolls && !roll.isDeterministic) rolls.push(roll);
				return roll;
			});
		if (rolls && !roll.isDeterministic) rolls.push(roll);
		return roll;
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Error to throw when consumption cannot be achieved.
 */
export class ConsumptionError extends Error {
	constructor(...args) {
		super(...args);
		this.name = "ConsumptionError";
	}
}
