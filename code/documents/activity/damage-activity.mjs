import { DamageData } from "../../data/activity/damage-data.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for rolling damage.
 */
export default class DamageActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "damage",
				dataModel: DamageData,
				icon: "systems/black-flag/artwork/activities/damage.svg",
				title: "BF.DAMAGE.Label",
				hint: "BF.DAMAGE.Hint",
				usage: {
					actions: {
						rollDamage: DamageActivity.#rollDamage
					}
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_activationChatButtons() {
		const buttons = [];
		if (this.hasDamage)
			buttons.push({
				label: game.i18n.localize("BF.DAMAGE.Label"),
				icon: '<i class="fa-solid fa-burst" inert></i>',
				dataset: {
					action: "rollDamage"
				}
			});
		return buttons.concat(super._activationChatButtons());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _triggerSubsequentActions(config, results) {
		this.rollDamage({ event: config.event });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle performing a damage roll.
	 * @this {DamageActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	static #rollDamage(event, target, message) {
		this.rollDamage({ event });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getDamageConfig(config = {}) {
		const rollConfig = super.getDamageConfig(config);

		rollConfig.critical ??= {};
		rollConfig.critical.allow ??= this.system.damage.critical.allow;
		rollConfig.critical.bonusDamage ??= this.system.damage.critical.bonus;

		return rollConfig;
	}
}
