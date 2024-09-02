import { HealData } from "../../data/activity/heal-data.mjs";
import Activity from "./activity.mjs";

export default class HealActivity extends Activity {
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "heal",
				dataModel: HealData,
				icon: "systems/black-flag/artwork/activities/heal.svg",
				title: "BF.HEAL.Title",
				hint: "BF.HEAL.Hint",
				usage: {
					actions: {
						rollHealing: HealActivity.#rollHealing
					}
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get ability() {
		if (this.system.ability) return this.system.ability;
		return super.ability;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get hasDamage() {
		return this.system.healing?.formula;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_activationChatButtons() {
		const buttons = [];
		if (this.system.healing?.formula)
			buttons.push({
				label: game.i18n.localize("BF.HEAL.Title"),
				icon: null, // TODO: Figure out healing icon
				dataset: {
					action: "rollHealing"
				}
			});
		return buttons.concat(super._activationChatButtons());
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle performing a healing roll.
	 * @this {HealActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	static #rollHealing(event, target, message) {
		this.rollDamage({ event });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getDamageConfig(config = {}) {
		if (!this.hasDamage) return foundry.utils.mergeObject({ rolls: [] }, config);

		const rollConfig = foundry.utils.mergeObject({ critical: { allow: false }, scaling: 0 }, config);
		const rollData = this.getRollData();
		rollConfig.rolls = [
			this._processDamagePart(this.system.healing, rollConfig, rollData, { modifierData: { type: "healing" } })
		].concat(config.rolls ?? []);

		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Healing formula and activity.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{rolls: DamageRollConfiguration[], activity: Activity}|null}
	 */
	getDamageDetails(options = {}) {
		return { rolls: this.createHealingConfig().rolls, activity: this };
	}
}
