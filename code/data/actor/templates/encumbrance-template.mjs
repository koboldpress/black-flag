import BlackFlagActiveEffect from "../../../documents/active-effect.mjs";

import { simplifyBonus } from "../../../utils/_module.mjs";

/**
 * Data definition template for actors that need to calculate carrying capacity.
 */
export default class EncumbranceTemplate extends foundry.abstract.DataModel {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Initialize base encumbrance fields so they can be targeted by active effects.
	 */
	prepareBaseEncumbrance() {
		const encumbrance = this.attributes.encumbrance ??= {};
		encumbrance.multipliers = {
			encumbered: "1", heavilyEncumbered: "1", maximum: "1", overall: "1"
		};
		encumbrance.bonuses = {
			encumbered: "", heavilyEncumbered: "", maximum: "", overall: ""
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare final language labels.
	 * @param {object} rollData
	 * @param {object} [options={}]
	 * @param {Function} [options.validateItem] - Method to determine whether an item should count towards carried weight.
	 */
	prepareDerivedEncumbrance(rollData, { validateItem }={}) {
		const config = CONFIG.BlackFlag.encumbrance;
		const encumbrance = this.attributes.encumbrance ??= {};
		const baseUnits = config.baseUnits[this.parent.type] ?? config.baseUnits.default;
		const unitSystem = "imperial";

		// Get the total weight from items
		let weight = this.parent.items
			.filter(item => !item.container && (validateItem?.(item) ?? true))
			.reduce((weight, item) => weight + (item.system.totalWeightIn?.(baseUnits[unitSystem]) ?? 0), 0);

		// Determine size class
		// TODO: Add support for Powerful Build
		const sizeConfig = CONFIG.BlackFlag.sizes[this.traits.size];
		const sizeMod = sizeConfig?.capacityMultiplier ?? sizeConfig?.token ?? 1;

		// Calculate encumbrance thresholds
		let maximumMultiplier;
		encumbrance.thresholds = Array.from(Object.keys(config.threshold)).reduce((obj, threshold) => {
			let base = this.abilities.strength?.value ?? 0;
			const bonus = simplifyBonus(encumbrance.bonuses?.[threshold], rollData)
				+ simplifyBonus(encumbrance.bonuses?.overall, rollData);
			let multiplier = simplifyBonus(encumbrance.multipliers[threshold], rollData)
				* simplifyBonus(encumbrance.multipliers.overall, rollData);
			if ( threshold === "maximum" ) maximumMultiplier = multiplier;
			multiplier *= (config.threshold[threshold]?.[unitSystem] ?? 1) * sizeMod;
			obj[threshold] = (base * multiplier).toNearest(0.1) + bonus;
			return obj;
		}, {});

		// Populate final encumbrance values
		encumbrance.value = weight.toNearest(0.1);
		encumbrance.max = encumbrance.thresholds.maximum;
		encumbrance.multiplier = (sizeMod * maximumMultiplier).toNearest(0.1);
		if ( encumbrance.max ) {
			encumbrance.stops = {
				encumbered: Math.clamp((encumbrance.thresholds.encumbered * 100) / encumbrance.max, 0, 100),
				heavilyEncumbered: Math.clamp((encumbrance.thresholds.heavilyEncumbered * 100) / encumbrance.max, 0, 100)
			};
			encumbrance.percentage = Math.clamp((encumbrance.value * 100) / encumbrance.max, 0, 100);
		} else {
			encumbrance.stops = { encumbered: 0, heavilyEncumbered: 0 };
			encumbrance.percentage = 0;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle applying or removing encumbrance status effects.
	 * @param {DocumentModificationContext} options - Additional options supplied with the update.
	 * @returns {Promise<BlackFlagActiveEffect>|void}
	 */
	updateEncumbrance(options) {
		const encumbrance = this.attributes?.encumbrance;
		if ( !encumbrance || (game.settings.get(game.system.id, "encumbrance") === "none") ) return;
		const statuses = [];
		const variant = game.settings.get(game.system.id, "encumbrance") === "variant";
		if ( encumbrance.value > encumbrance.thresholds.maximum ) statuses.push("exceedingCarryingCapacity");
		if ( encumbrance.value > encumbrance.thresholds.heavilyEncumbered && variant ) statuses.push("heavilyEncumbered");
		if ( encumbrance.value > encumbrance.thresholds.encumbered && variant ) statuses.push("encumbered");

		const effect = this.parent.effects.get(BlackFlagActiveEffect.ID.ENCUMBERED);
		if ( !statuses.length ) return effect?.delete();

		const effectData = { ...CONFIG.BlackFlag.encumbrance.effects[statuses[0]], statuses };
		effectData.name = game.i18n.localize(effectData.name);
		if ( effect ) {
			const originalEncumbrance = effect.statuses.first();
			return effect.update(effectData, { [game.system.id]: { originalEncumbrance } });
		}

		return ActiveEffect.implementation.create(
			{ _id: BlackFlagActiveEffect.ID.ENCUMBERED, ...effectData },
			{ parent: this.parent, keepId: true }
		)
	}
}
