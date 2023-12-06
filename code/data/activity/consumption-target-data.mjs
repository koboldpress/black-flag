import { numberFormat } from "../../utils/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import ConsumptionError from "./consumption-error.mjs";

const { StringField } = foundry.data.fields;

/**
 * Data model for consumption targets.
 */
export default class ConsumptionTargetData extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			type: new StringField({label: "BF.Consumption.Type.Label"}),
			target: new StringField({label: "BF.Consumption.Target.Label"}),
			value: new FormulaField({initial: "1", label: "BF.Consumption.Amount.Label"}),
			scale: new FormulaField({label: "BF.Consumption.Scale.Label"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
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
		if ( !config?.validTargets ) return null;
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
				key, label: config.label, disabled: existingTypes.has(key) && (this.type !== key)
			}))
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve the provided cost formula as a dice roll.
	 * @param {string} formula - Cost formula to resolve.
	 * @returns {BaseRoll}
	 */
	async resolveCost(formula) {
		const roll = new Roll(formula, this.parent.item.getRollData());
		await roll.evaluate();
		return roll;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve and scale the cost.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @returns {number}
	 */
	scaleCost(config) {
		// TODO: Calculate total uses to consume based on scaling
		return this.value;
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
		if ( !typeConfig?.consume ) return;
		if ( foundry.utils.getType(typeConfig.consume) === "string" ) {
			if ( !this[typeConfig.consume] ) throw new Error(
				`Consume method "${thisConfig.consume}" defined by ${this.type} not found on on ConsumptionTargetData to call.`
			);
			await this[typeConfig.consume](activity, config, updates);
		} else if ( foundry.utils.getType(typeConfig.consume) === "function" ) {
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
		updates.activity["uses.spent"] = await this._usesConsumption(
			config, activity.uses, game.i18n.format("BF.Consumption.Type.ActivityUses.Warning", {
				itemName: activity.item.name, activityName: activity.name
			}), updates.rolls
		);
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
		if ( !item ) throw new Error("item not found");

		const newSpent = await this._usesConsumption(
			config, item.system.uses, game.i18n.format("BF.Consumption.Type.ItemUses.Warning", { name: item.name }),
			updates.rolls
		);
		if ( newSpent === null ) return;

		const itemIndex = updates.item.findIndex(i => i._id === item.id);
		if ( itemIndex === -1 ) updates.item.push({ _id: item.id, "system.uses.spent": newSpent });
		else updates.item[itemIndex]["system.uses.spent"] = newSpent;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate uses updates.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {object} uses - Uses object on an Item or Activity.
	 * @param {string} type - Type property that will be provided to warning messages.
	 * @param {Roll[]} rolls - Rolls performed as part of the activation.
	 * @returns {number|null} - New spent uses value, or `null` for no change.
	 * @internal
	 */
	async _usesConsumption(config, uses, type, rolls) {
		const roll = await this.resolveCost(this.scaleCost(config));
		if ( !roll.isDeterministic ) rolls.push(roll);
		const cost = roll.total;

		const newValue = uses.value - cost;

		let warningMessage;
		if ( (cost > 0) && !uses.value ) warningMessage = "BF.Consumption.Warning.None";
		else if ( newValue < uses.min ) warningMessage = "BF.Consumption.Warning.NotEnough";
		if ( warningMessage ) throw new ConsumptionError(game.i18n.format(warningMessage, {
			type, cost: numberFormat(cost, { spelledOut: true }), available: numberFormat(uses.value, { spelledOut: true })
		}));

		if ( (cost < 0) && !uses.spent ) return null;
		return Math.clamped(uses.spent + cost, 0, uses.max - uses.min);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare updates for hit dice consumption.
	 * @param {Activity} activity - Activity being activated.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivationUpdates} updates - Updates to be performed.
	 */
	async consumeHitDice(activity, config, updates) {
		const roll = await this.resolveCost(this.scaleCost(config));
		if ( !roll.isDeterministic ) updates.rolls.push(roll);
		const cost = roll.total;

		const actor = activity.actor;
		const availableDenominations = Object.entries(actor.system.attributes.hd.d);
		if ( this.target === "smallest" ) availableDenominations.sort((lhs, rhs) => lhs[0] - rhs[0]);
		else if ( this.target === "largest" ) availableDenominations.sort((lhs, rhs) => rhs[0] - lhs[0]);
		else {
			const denom = actor.system.attributes.hd.d[this.target];

			let warningMessage;
			if ( !denom ) warningMessage = "BF.Consumption.Warning.MissingHitDice";
			else if ( (denom.available === 0) && (cost > 0) ) warningMessage = "BF.Consumption.Warning.None";
			else if ( denom.available < cost ) warningMessage = "BF.Consumption.Warning.NotEnough";
			if ( warningMessage ) {
				const denomination = `d${this.target}`;
				throw new ConsumptionError(game.i18n.format(warningMessage, {
					type: game.i18n.format("BF.Consumption.Type.HitDice.Warning", { denomination }), denomination,
					cost: numberFormat(cost, { spelledOut: true }), available: numberFormat(denom?.value, { spelledOut: true })
				}));
			}

			if ( (cost < 0) && !denom.spent ) return;
			updates.actor[`system.attributes.hd.d.${this.target}.spent`] = Math.clamped(denom.spent + cost, 0, denom.max);
			return;
		}

		// Loop over available denominations, subtracting or adding cost until it is all spent
		let remaining = cost;
		for ( const [d, denom] of availableDenominations ) {
			const delta = remaining > 0 ? Math.min(remaining, denom.available) : Math.max(remaining, -denom.spent);
			if ( delta !== 0 ) {
				updates.actor[`system.attributes.hd.d.${d}.spent`] = denom.spent + delta;
				remaining -= delta;
			}
			if ( remaining === 0 ) return;
		}
		if ( remaining > 0 ) {
			const available = Object.values(actor.system.attributes.hd.d).reduce((sum, d) => sum + d.available, 0);
			const warningMessage = `BF.Consumption.Warning.${available > 0 ? "NotEnough" : "None"}`;
			throw new ConsumptionError(game.i18n.format(warningMessage, {
				type: game.i18n.localize("BF.HitDie.Label[other]").toLowerCase(),
				cost: numberFormat(cost, { spelledOut: true }), available: numberFormat(available, { spelledOut: true })
			}));
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
		const roll = await this.resolveCost(this.value);
		if ( !roll.isDeterministic ) updates.rolls.push(roll);
		const cost = roll.total;
		// TODO: Increase ring based on scale value
		const ringNumber = this.target;

		// Check to see if enough slots available at specified ring
		const ringData = activity.actor.system.spellcasting?.rings?.[`ring-${ringNumber}`];
		const newSpent = (ringData?.spent ?? 0) + cost;
		let warningMessage;
		if ( !ringData?.max ) warningMessage = "BF.Consumption.Warning.MissingSpellRing";
		else if ( (cost > 0) && !ringData.value ) warningMessage = "BF.Consumption.Warning.None";
		else if ( newSpent > ringData.max ) warningMessage = "BF.Consumption.Warning.NotEnough";
		if ( warningMessage ) {
			const ring = CONFIG.BlackFlag.spellRings()[ringNumber].toLowerCase();
			const type = game.i18n.format("BF.Consumption.Type.SpellSlots.Warning", { ring });
			throw new ConsumptionError(game.i18n.format(warningMessage, {
				type, ring, cost: numberFormat(cost, { spelledOut: true }),
				available: numberFormat(ringData?.value, { spelledOut: true })
			}));
		}

		if ( (cost < 0) && !ringData.spent ) return;
		updates.actor[`system.spellcasting.rings.ring-${ringNumber}.spent`] = Math.clamped(newSpent, 0, ringData.max);
	}
}