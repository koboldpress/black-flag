import {
	getAttributeOption,
	getPluralRules,
	numberFormat,
	simplifyBonus,
	simplifyFormula
} from "../../../utils/_module.mjs";
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
			type: new StringField({ label: "BF.CONSUMPTION.Type.Label" }),
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
	 * Placeholder for the target field.
	 * @type {string|null}
	 */
	get placeholder() {
		if (this.type !== "item") return null;
		return game.i18n.localize("BF.CONSUMPTION.Type.ItemUses.ThisItem");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Method of scaling this consumption.
	 * @type {FormSelectOption[]|null}
	 */
	get scalingModes() {
		if (CONFIG.BlackFlag.consumptionTypes[this.type]?.scalingModes === false) return null;
		return [
			{ value: "", label: game.i18n.localize("BF.Consumption.Scaling.Mode.None") },
			{ value: "amount", label: game.i18n.localize("BF.Consumption.Scaling.Mode.Amount") },
			...Object.entries(CONFIG.BlackFlag.consumptionTypes[this.type].scalingModes ?? {}).map(([value, config]) => ({
				value,
				label: game.i18n.localize(config.label)
			}))
		];
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
	 * @type {FormSelectOption[]|null}
	 */
	get validTargets() {
		return this.constructor.getValidTargets(this.type, this.parent);
	}

	/**
	 * List of valid targets for a specific type.
	 * @param {string} type - Consumption type.
	 * @param {Activity} activity - Activity that contains the target.
	 * @returns {FormSelectOption[]|null}
	 */
	static getValidTargets(type, activity) {
		const config = CONFIG.BlackFlag.consumptionTypes[type];
		if (!config?.validTargets || (!activity.item?.isEmbedded && config.targetRequiresEmbedded === true)) return null;
		return config.validTargets.call(activity);
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
			type: game.i18n.format("BF.CONSUMPTION.Type.ActivityUses.Warning", {
				itemName: this.item.name,
				activityName: this.activity.name
			}),
			rolls: updates.rolls
		});
		if (result) foundry.utils.mergeObject(updates.activity, { "uses.spent": result.spent });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates for attribute consumption.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	static async consumeAttribute(config, updates) {
		const cost = (await this.resolveCost({ config, rolls: updates.rolls })).total;
		const keyPath = `system.${this.target}`;
		const attribute = getAttributeOption(this.target)?.label ?? this.target;

		if (!foundry.utils.hasProperty(this.actor, keyPath))
			throw new ConsumptionError(
				game.i18n.format("BF.CONSUMPTION.Warning.MissingAttribute", {
					activity: this.activity.name,
					attribute,
					item: this.item.name
				})
			);
		const current = foundry.utils.getProperty(this.actor, keyPath);

		let warningMessage;
		if (cost > 0 && !current) warningMessage = "BF.CONSUMPTION.Warning.None";
		else if (current < cost) warningMessage = "BF.CONSUMPTION.Warning.NotEnough";
		if (warningMessage)
			throw new ConsumptionError(
				game.i18n.format(warningMessage, {
					available: numberFormat(current),
					cost: numberFormat(cost),
					type: game.i18n.format("BF.CONSUMPTION.Type.Attribute.Warning", { attribute })
				})
			);

		updates.actor[keyPath] = current - cost;
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

		if (!this.actor.system.attributes?.hd)
			throw new ConsumptionError(game.i18n.format("BF.CONSUMPTION.Warning.MissingHitDice", { denomination: "" }));

		const availableDenominations = Object.entries(this.actor.system.attributes.hd.d);
		if (this.target === "smallest") availableDenominations.sort((lhs, rhs) => lhs[0] - rhs[0]);
		else if (this.target === "largest") availableDenominations.sort((lhs, rhs) => rhs[0] - lhs[0]);
		else {
			const denom = this.actor.system.attributes.hd.d[this.target];

			let warningMessage;
			if (!denom) warningMessage = "BF.CONSUMPTION.Warning.MissingHitDice";
			else if (denom.available === 0 && cost > 0) warningMessage = "BF.CONSUMPTION.Warning.None";
			else if (denom.available < cost) warningMessage = "BF.CONSUMPTION.Warning.NotEnough";
			if (warningMessage) {
				const denomination = `d${this.target}`;
				throw new ConsumptionError(
					game.i18n.format(warningMessage, {
						type: game.i18n.format("BF.CONSUMPTION.Type.HitDice.Warning", { denomination }),
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
			const warningMessage = `BF.CONSUMPTION.Warning.${available > 0 ? "NotEnough" : "None"}`;
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
		if (!item)
			throw new ConsumptionError(
				game.i18n.format("BF.CONSUMPTION.Warning.MissingItem", {
					activity: this.activity.name,
					item: this.item.name
				})
			);

		const result = await this._usesConsumption(config, {
			uses: item.system.uses,
			quantity: item.system.quantity ?? 1,
			type: game.i18n.format("BF.CONSUMPTION.Type.ItemUses.Warning", { name: item.name }),
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
		if (!circleData?.max) warningMessage = "BF.CONSUMPTION.Warning.MissingSpellCircle";
		else if (cost > 0 && !circleData.value) warningMessage = "BF.CONSUMPTION.Warning.None";
		else if (newSpent > circleData.max) warningMessage = "BF.CONSUMPTION.Warning.NotEnough";
		if (warningMessage) {
			const circle = CONFIG.BlackFlag.spellCircles()[circleNumber].toLowerCase();
			const type = game.i18n.format("BF.CONSUMPTION.Type.SpellSlots.Warning", { circle });
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
		const maxUses = uses.max || 1;
		const canConsumeQuantity = uses.consumeQuantity && quantity && cost > 0;
		if (canConsumeQuantity) availableUses += quantity * maxUses;

		let warningMessage;
		if (cost > 0 && !availableUses) warningMessage = "BF.CONSUMPTION.Warning.None";
		else if (cost > availableUses) warningMessage = "BF.CONSUMPTION.Warning.NotEnough";
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
		while (remainingCost > maxUses) {
			remainingCost -= maxUses;
			deltaQuantity += 1;
		}
		return { spent: remainingCost, quantity: quantity - deltaQuantity };
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Consumption Labels         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create label and hint text indicating how much of this resource will be consumed/recovered.
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activity usage.
	 * @param {boolean} consumed - Is this consumption currently set to be consumed?
	 * @returns {ConsumptionLabels}
	 */
	getConsumptionLabels(config, consumed) {
		const typeConfig = CONFIG.BlackFlag.consumptionTypes[this.type];
		if (!typeConfig?.consumptionLabels) return "";
		return typeConfig.consumptionLabels.call(this, config, consumed);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create hint text indicating how much of this resource will be consumed/recovered.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activity usage.
	 * @param {boolean} consumed - Is this consumption currently set to be consumed?
	 * @returns {ConsumptionLabels}
	 */
	static consumptionLabelsActivityUses(config, consumed) {
		const { cost, simplifiedCost, increaseKey, pluralRule } = this._resolveHintCost(config);
		const uses = this.activity.uses;
		const usesPluralRule = getPluralRules().select(uses.value);
		return {
			label: game.i18n.localize(`BF.CONSUMPTION.Type.ActivityUses.Prompt${increaseKey}`),
			hint: game.i18n.format(`BF.CONSUMPTION.Type.ActivityUses.PromptHint${increaseKey}`, {
				cost,
				use: game.i18n.localize(`BF.CONSUMPTION.Type.Use.${pluralRule}`),
				available: numberFormat(uses.value),
				availableUse: game.i18n.localize(`BF.CONSUMPTION.Type.Use.${usesPluralRule}`)
			}),
			warn: simplifiedCost > uses.value
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create hint text indicating how much of this resource will be consumed/recovered.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activity usage.
	 * @param {boolean} consumed - Is this consumption currently set to be consumed?
	 * @returns {ConsumptionLabels}
	 */
	static consumptionLabelsAttribute(config, consumed) {
		const { cost, simplifiedCost, increaseKey } = this._resolveHintCost(config);
		const current = foundry.utils.getProperty(this.actor.system, this.target);
		return {
			label: game.i18n.localize(`BF.CONSUMPTION.Type.Attribute.Prompt${increaseKey}`),
			hint: game.i18n.format(`BF.CONSUMPTION.Type.Attribute.PromptHint${increaseKey}`, {
				cost,
				attribute: getAttributeOption(this.target)?.label ?? this.target,
				current: numberFormat(current)
			}),
			warn: simplifiedCost > current
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create hint text indicating how much of this resource will be consumed/recovered.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activity usage.
	 * @param {boolean} consumed - Is this consumption currently set to be consumed?
	 * @returns {ConsumptionLabels}
	 */
	static consumptionLabelsHitDice(config, consumed) {
		const { cost, simplifiedCost, increaseKey, pluralRule } = this._resolveHintCost(config);
		let denomination;
		if (this.target === "smallest") denomination = game.i18n.localize("BF.CONSUMPTION.Type.HitDice.Smallest");
		else if (this.target === "largest") denomination = game.i18n.localize("BF.CONSUMPTION.Type.HitDice.Largest");
		else denomination = `d${this.target}`;
		const available =
			(["smallest", "largest"].includes(this.target)
				? this.actor.system.attributes?.hd?.available
				: this.actor.system.attributes?.hd?.d[this.target]?.available) ?? 0;
		return {
			label: game.i18n.localize(`BF.CONSUMPTION.Type.HitDice.Prompt${increaseKey}`),
			hint: game.i18n.format(`BF.CONSUMPTION.Type.HitDice.PromptHint${increaseKey}`, {
				cost,
				denomination: denomination.toLowerCase(),
				die: game.i18n.localize(`BF.CONSUMPTION.Type.HitDie.${pluralRule}`),
				available: numberFormat(available)
			}),
			warn: simplifiedCost > available
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create hint text indicating how much of this resource will be consumed/recovered.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activity usage.
	 * @param {boolean} consumed - Is this consumption currently set to be consumed?
	 * @returns {ConsumptionLabels}
	 */
	static consumptionLabelsItemUses(config, consumed) {
		const { cost, simplifiedCost, increaseKey, pluralRule } = this._resolveHintCost(config);
		const item = this.actor.items.get(this.target);
		const itemName = item ? item.name : game.i18n.localize("BF.CONSUMPTION.Type.ItemUses.ThisItem").toLowerCase();
		const uses = (item ?? this.item).system.uses;
		const usesPluralRule = getPluralRules().select(uses.value);

		let totalUses = uses.value;
		if (uses.consumeQuantity) {
			let quantity = (item ?? this.item).system.quantity ?? 1;
			if (uses.value) quantity -= 1;
			totalUses += quantity * (uses.max || 1);
		}

		return {
			label: game.i18n.localize(`BF.CONSUMPTION.Type.ItemUses.Prompt${increaseKey}`),
			hint: game.i18n.format(`BF.CONSUMPTION.Type.ItemUses.PromptHint${increaseKey}`, {
				cost,
				use: game.i18n.localize(`BF.CONSUMPTION.Type.Use.${pluralRule}`),
				available: numberFormat(totalUses),
				availableUse: game.i18n.localize(`BF.CONSUMPTION.Type.Use.${usesPluralRule}`),
				item: item ? `<em>${itemName}</em>` : itemName
			}),
			warn: simplifiedCost > totalUses
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create hint text indicating how much of this resource will be consumed/recovered.
	 * @this {ConsumptionTargetData}
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activity usage.
	 * @param {boolean} consumed - Is this consumption currently set to be consumed?
	 * @returns {ConsumptionLabels}
	 */
	static consumptionLabelsSpellSlots(config, consumed) {
		const { cost, simplifiedCost, increaseKey, pluralRule } = this._resolveHintCost(config);
		const number = Math.clamp(this.resolveCircle({ config }), 1, CONFIG.BlackFlag.maxSpellCircle);
		const level = CONFIG.BlackFlag.spellCircles()[number].toLowerCase();
		const available = this.actor.system.spellcasting?.slots?.[`circle-${number}`]?.value ?? 0;
		return {
			label: game.i18n.localize(`BF.CONSUMPTION.Type.SpellSlots.Prompt${increaseKey}`),
			hint: game.i18n.format(`BF.CONSUMPTION.Type.SpellSlots.PromptHint${increaseKey}`, {
				cost,
				slot: game.i18n.format(`BF.CONSUMPTION.Type.SpellSlot.${pluralRule}`, { level }),
				available: numberFormat(available)
			}),
			warn: simplifiedCost > available
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve the cost for the consumption hint.
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activity usage.
	 * @returns {{ cost: string, simplifiedCost: number, increaseKey: string, pluralRule: string }}
	 * @internal
	 */
	_resolveHintCost(config) {
		const costRoll = this.resolveCost({ config, evaluate: false });
		let cost = costRoll.isDeterministic ? String(costRoll.evaluateSync().total) : simplifyFormula(costRoll.formula);
		const simplifiedCost = simplifyBonus(cost);
		const isNegative = cost.startsWith("-");
		if (isNegative) cost = cost.replace("-", "");
		let pluralRule;
		if (costRoll.isDeterministic) pluralRule = new Intl.PluralRules(game.i18n.lang).select(Number(cost));
		else pluralRule = "other";
		return { cost, simplifiedCost, increaseKey: isNegative ? "Increase" : "Decrease", pluralRule };
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Valid Targets            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a list of targets for the "Attribute" consumption type.
	 * @this {ConsumptionTargetData}
	 * @returns {FormSelectOption[]}
	 */
	static validAttributeTargets() {
		if (!this.actor) return [];
		return (CONFIG.BlackFlag.consumableResources[this.actor.type] ?? [])
			.map(a => getAttributeOption(a))
			.sort((lhs, rhs) => {
				if (lhs.group === rhs.group) return lhs.label.localeCompare(rhs.label, game.i18n.lang);
				const lhsKey = lhs.group || lhs.label;
				const rhsKey = rhs.group || rhs.label;
				return lhsKey.localeCompare(rhsKey, game.i18n.lang);
			});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a list of targets for the "Hit Dice" consumption type.
	 * @this {ConsumptionTargetData}
	 * @returns {FormSelectOption[]}
	 */
	static validHitDiceTargets() {
		return [
			{ value: "smallest", label: game.i18n.localize("BF.CONSUMPTION.Type.HitDice.Smallest") },
			...CONFIG.BlackFlag.hitDieSizes.map(d => ({ value: d, label: `d${d}` })),
			{ value: "largest", label: game.i18n.localize("BF.CONSUMPTION.Type.HitDice.Largest") }
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
				label = game.i18n.format("BF.CONSUMPTION.Uses.Available.Period", { value: numberFormat(uses.max), period });
			} else {
				const type = game.i18n.localize(
					`BF.CONSUMPTION.Uses.Available.Charges[${getPluralRules().select(uses.value)}]`
				);
				label = game.i18n.format("BF.CONSUMPTION.Uses.Available.Limited", { value: numberFormat(uses.value), type });
			}
			return `${name} (${label})`;
		};
		const options = [
			{ value: "", label: makeLabel(game.i18n.localize("BF.CONSUMPTION.Type.ItemUses.ThisItem"), this.item) }
		];
		const items = (this.actor?.items ?? []).filter(i => i.system.uses?.max && i !== this.item);
		if (items.length) options.push({ rule: true }, ...items.map(i => ({ value: i.id, label: makeLabel(i.name, i) })));
		return options;
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
					else if (term instanceof foundry.dice.terms.NumericTerm) term.number += term.number >= 0 ? scaling : -scaling;
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
