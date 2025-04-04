import { HealData } from "../../data/activity/heal-data.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for performing healing.
 */
export default class HealActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
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
	get damageFlavor() {
		return game.i18n.localize("BF.Healing.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get hasDamage() {
		return this.system.healing?.formula;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get modifierData() {
		return {
			kind: "heal",
			...super.modifierData
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_activationChatButtons() {
		const buttons = [];
		if (this.system.healing?.formula) {
			const config = CONFIG.BlackFlag.healingTypes[this.system.healing.type];
			buttons.push({
				label: game.i18n.localize("BF.HEAL.Title"),
				icon: config?.icon ? `<i class="blackFlag-icon" data-src="${config.icon}" inert></i>` : null,
				dataset: {
					action: "rollHealing"
				}
			});
		}
		return buttons.concat(super._activationChatButtons());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _triggerSubsequentActions(config, results) {
		this.rollDamage(
			{ event: config.event },
			{},
			{ [`data.flags.${game.system.id}.originatingMessage`]: results.message?.id }
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async rollDamage(config = {}, dialog = {}, message = {}) {
		const messageConfig = foundry.utils.mergeObject(
			{
				[`data.flags.${game.system.id}.roll.type`]: "healing"
			},
			message
		);
		return super.rollDamage(config, dialog, messageConfig);
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

		const rollConfig = foundry.utils.mergeObject({ critical: { allow: false } }, config);
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
		return { rolls: this.getDamageConfig().rolls, activity: this };
	}
}
