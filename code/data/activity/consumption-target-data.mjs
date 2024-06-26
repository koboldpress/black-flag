import { numberFormat } from "../../utils/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import ConsumptionError from "./consumption-error.mjs";

const { SchemaField, StringField } = foundry.data.fields;

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
export default class ConsumptionTargetData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new StringField({ label: "BF.Consumption.Type.Label" }),
			target: new StringField({ label: "BF.Consumption.Target.Label" }),
			value: new FormulaField({ initial: "1", label: "BF.Consumption.Amount.Label" }),
			scaling: new SchemaField({
				mode: new StringField({ label: "BF.Damage.Scaling.Mode.Label" }),
				formula: new FormulaField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
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
		return config.validTargets(activity);
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
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve the spell circle to consume, taking scaling into account.
	 * @param {object} [options={}]
	 * @param {ActivityActivationConfiguration} [options.config={}] - Configuration info for the activation.
	 * @param {boolean} [options.evaluate=true] - Should the circle roll be evaluated?
	 * @returns {Promise<BasicRoll>}
	 */
	async resolveCircle({ config = {}, ...options } = {}) {
		return this._resolveScaledRoll(this.target, this.scaling.mode === "circle" ? config.scaling ?? 0 : 0, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve the provided cost formula as a dice roll.
	 * @param {object} [options={}]
	 * @param {ActivityActivationConfiguration} [options.config={}] - Configuration info for the activation.
	 * @param {boolean} [options.evaluate=true] - Should the cost roll be evaluated?
	 * @returns {Promise<BasicRoll>}
	 */
	async resolveCost({ config = {}, ...options } = {}) {
		return this._resolveScaledRoll(this.value, this.scaling.mode === "amount" ? config.scaling ?? 0 : 0, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve a scaling consumption value.
	 * @param {string} formula - Formula for the initial value.
	 * @param {number} scaling - Amount to scale the formula.
	 * @param {object} [options={}]
	 * @param {boolean} [options.evaluate=true] - Should the roll be evaluated?
	 * @returns {Promise<BasicRoll>}
	 * @internal
	 */
	async _resolveScaledRoll(formula, scaling, { evaluate = true } = {}) {
		const rollData = this.parent.item.getRollData();
		const roll = new CONFIG.Dice.BasicRoll(formula, rollData);

		if (scaling) {
			// If a scaling formula is provided, multiply it an add to the end of the initial formula
			if (this.scaling.formula) {
				const scalingRoll = new Roll(this.scaling.formula, rollData);
				scalingRoll.alter(scaling, undefined, { multiplyNumeric: true });
				roll.terms.push(new OperatorTerm({ operator: "+" }), ...scalingRoll.terms);
			}

			// Otherwise increase the number of dice and the numeric term for each scaling step
			else {
				roll.terms = roll.terms.map(term => {
					if (term instanceof DiceTerm) return term.alter(undefined, scaling);
					else if (term instanceof NumericTerm) term.number += scaling;
					return term;
				});
			}

			roll.resetFormula();
		}

		if (evaluate) await roll.evaluate();
		return roll;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates that will be applied upon consumption.
	 * @param {Activity} activity - Activity being activated.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	async prepareConsumptionUpdates(activity, config, updates) {
		const typeConfig = CONFIG.BlackFlag.consumptionTypes[this.type];
		if (!typeConfig?.consume) return;
		if (foundry.utils.getType(typeConfig.consume) === "string") {
			if (!this[typeConfig.consume])
				throw new Error(
					`Consume method "${thisConfig.consume}" defined by ${this.type} not found on on ConsumptionTargetData to call.`
				);
			await this[typeConfig.consume](activity, config, updates);
		} else if (foundry.utils.getType(typeConfig.consume) === "function") {
			await typeConfig.consume(activity, config, this, updates);
		} else {
			throw new Error(`Consumption type ${this.type} does not have a consume method defined.`);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates for activity uses consumption.
	 * @param {Activity} activity - Activity being activated.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	async consumeActivity(activity, config, updates) {
		const result =
			(await this._usesConsumption(config, {
				uses: activity.uses,
				type: game.i18n.format("BF.Consumption.Type.ActivityUses.Warning", {
					itemName: activity.item.name,
					activityName: activity.name
				}),
				rolls: updates.rolls
			})) ?? {};
		if (result) updates.activity["uses.spent"] = result.spent;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates for item uses consumption.
	 * @param {Activity} activity - Activity being activated.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	async consumeItem(activity, config, updates) {
		const item = this.target ? activity.actor.items.get(this.target) : activity.item;
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
		else foundry.utils.mergeObject(updates.item[itemIndex]["system.uses.spent"], update);
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
		const costRoll = await this.resolveCost({ config });
		if (!costRoll.isDeterministic) updates.rolls.push(costRoll);
		const cost = costRoll.total;

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

	/**
	 * Prepare updates for hit dice consumption.
	 * @param {Activity} activity - Activity being activated.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	async consumeHitDice(activity, config, updates) {
		const costRoll = await this.resolveCost({ config });
		if (!costRoll.isDeterministic) updates.rolls.push(costRoll);
		const cost = costRoll.total;

		const actor = activity.actor;
		const availableDenominations = Object.entries(actor.system.attributes.hd.d);
		if (this.target === "smallest") availableDenominations.sort((lhs, rhs) => lhs[0] - rhs[0]);
		else if (this.target === "largest") availableDenominations.sort((lhs, rhs) => rhs[0] - lhs[0]);
		else {
			const denom = actor.system.attributes.hd.d[this.target];

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
			const available = Object.values(actor.system.attributes.hd.d).reduce((sum, d) => sum + d.available, 0);
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
	 * Prepare updates for spell slot consumption.
	 * @param {Activity} activity - Activity being activated.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	async consumeSpellSlots(activity, config, updates) {
		const costRoll = await this.resolveCost({ config });
		if (!costRoll.isDeterministic) updates.rolls.push(costRoll);
		const cost = costRoll.total;

		const circleRoll = await this.resolveCircle({ config });
		if (!circleRoll.isDeterministic) updates.rolls.push(circleRoll);
		const circleNumber = circleRoll.total;

		// Check to see if enough slots available at specified circle
		const circleData = activity.actor.system.spellcasting?.circles?.[`circle-${circleNumber}`];
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
		updates.actor[`system.spellcasting.circles.circle-${circleNumber}.spent`] = Math.clamp(newSpent, 0, circleData.max);
	}
}
