import HitPointsConfig from "../../applications/advancement/hit-points-config.mjs";
// import HitPointsFlow from "../../applications/advancement/hit-points-flow.mjs";
import { HitPointsConfigurationData, HitPointsValueData } from "../../data/advancement/hit-points-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that presents the player with the option to roll hit points at each level or select the average value.
 * Keeps track of player hit point rolls or selection for each level. **Can only be added to classes and each
 * class can only have one.**
 */
export default class HitPointsAdvancement extends Advancement {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "hitPoints",
			dataModels: {
				configuration: HitPointsConfigurationData,
				value: HitPointsValueData
			},
			order: 10,
			icon: "systems/black-flag/artwork/advancement/hit-points.svg",
			title: game.i18n.localize("BF.Advancement.HitPoints.Title"),
			hint: game.i18n.localize("BF.Advancement.HitPoints.Hint"),
			multiLevel: true,
			apps: {
				config: HitPointsConfig,
				// flow: HitPointsFlow
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Current hit dice denomination. This fetches from the actor first to take any changes
	 * through active effects into account.
	 * @type {number}
	 */
	get denomination() {
		return this.actor?.system.attributes.hd.denomination ?? this.configuration.denomination;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get levels() {
		return Array.fromRange(CONFIG.BlackFlag.maxLevel, 1);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	configuredForLevel(actor, level) {
		return this.valueForLevel(actor, level) !== null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Hit points given at the provided level.
	 * @param {BlackFlagActor} actor - Actor for which the value is being retrieved.
	 * @param {number} level - Level for which to get hit points.
	 * @returns {number|null} - Hit points for level or null if none have been taken.
	 */
	valueForLevel(actor, level) {
		return this.constructor.valueForLevel(this.value(actor).granted ?? {}, this.denomination, level);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Hit points given at the provided level.
	 * @param {object} data - Contents of `value` used to determine this value.
	 * @param {number} denomination - Face value of the hit die used by this advancement.
	 * @param {number} level - Level for which to get hit points.
	 * @returns {number|null} - Hit points for level or null if none have been taken.
	 */
	static valueForLevel(data, denomination, level) {
		const value = data[level];
		if ( value === "max" ) return denomination;
		if ( value === "avg" ) return (denomination / 2) + 1;
		if ( value instanceof Roll ) return value.total;
		if ( Number.isNumeric(value) ) return Number(value);
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static availableForItem(item) {
		return !item.system.advancement.byType("hitPoints").length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add the ability modifier and any bonuses to the provided hit points value to get the number to apply.
	 * @param {BlackFlagActor} actor - Actor for which the value is being calculated.
	 * @param {number} value - Hit points taken at a given level.
	 * @returns {number} - Hit points adjusted with ability modifier and per-level bonuses.
	 */
	#getApplicableValue(actor, value) {
		const abilityId = CONFIG.BlackFlag.defaultAbilities.hitPoints || "constitution";
		value = Math.max(value + (actor.system.abilities[abilityId]?.mod ?? 0), 1);
		value += simplifyBonus(actor.system.attributes.hp.bonuses.level, actor.getRollData());
		return value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Total hit points provided by this advancement.
	 * @param {BlackFlagActor} actor - Actor for which the total is being calculated.
	 * @returns {number} - Hit points currently selected.
	 */
	total(actor) {
		return Object.keys(this.value(actor).granted ?? {}).reduce((t, l) => t + this.valueForLevel(parseInt(l)), 0);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Total hit points taking the provided ability modifier into account, with a minimum of 1 per level.
	 * This method is designed to ensure no level provides negative HP even if the constitution modifier is negative.
	 * @param {BlackFlagActor} actor - Actor for which the total is being calculated.
	 * @param {number} mod - Modifier to add per level.
	 * @returns {number} - Total hit points plus modifier.
	 */
	getAdjustedTotal(actor, mod) {
		return Object.keys(this.value(actor).granted ?? {}).reduce((total, level) => {
			return total + Math.max(this.valueForLevel(actor, parseInt(level)) + mod, 1);
		}, 0);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	apply(actor, level, data) {
		// let value = this.constructor.valueForLevel(data, this.denomination, level);
		// if ( value === undefined ) return;
		// this.actor.updateSource({
		// 	"system.attributes.hp.value": this.actor.system.attributes.hp.value + this.#getApplicableValue(value)
		// });
		// this.updateSource({ "value.granted": data });
	}
}
