import { UtilityData } from "../../data/activity/utility-data.mjs";
import Activity from "./activity.mjs";

export default class UtilityActivity extends Activity {
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "utility",
				dataModel: UtilityData,
				icon: "systems/black-flag/artwork/activities/utility.svg",
				title: "BF.UTILITY.Title",
				hint: "BF.UTILITY.Hint",
				usage: {
					actions: {
						rollFormula: UtilityActivity.#rollFormula
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
		if (this.system.roll.formula)
			buttons.push({
				label: this.system.roll.name || game.i18n.localize("BF.Roll.Action.RollGeneric"),
				icon: '<i class="fa-solid fa-dice" inert></i>',
				dataset: {
					action: "rollFormula",
					visibility: this.system.roll.visible ? "all" : undefined
				}
			});
		return buttons.concat(super._activationChatButtons());
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll formula.
	 * @param {BasicRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {BasicRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<DamageRoll[]|void>}
	 */
	async rollFormula(config = {}, dialog = {}, message = {}) {
		if (!this.system.roll.formula) {
			console.warn(`No formula defined for the activity ${this.name} on ${this.item.name} (${this.uuid}).`);
			return;
		}

		const rollConfig = foundry.utils.deepClone(config);
		rollConfig.subject = this;
		rollConfig.rolls = [{ parts: [this.system.roll.formula], data: this.getRollData() }].concat(config.rolls ?? []);

		const dialogConfig = foundry.utils.mergeObject({
			configure: this.system.roll.prompt,
			options: {
				rollNotes: this.actor?.system.getModifiers?.(rollConfig.modifierData, "note"),
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
			}
		});

		const messageConfig = foundry.utils.mergeObject(
			{
				create: true,
				data: {
					flavor: this.name,
					flags: {
						[game.system.id]: {
							...this.messageFlags,
							type: "roll",
							roll: { type: "roll" }
						}
					},
					speaker: ChatMessage.getSpeaker({ actor: this.item.actor })
				}
			},
			message
		);

		/**
		 * A hook event that fires before the formula is rolled.
		 * @function blackFlag.preRollFormula
		 * @memberof hookEvents
		 * @param {BasicRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return false to prevent the roll from being performed.
		 */
		if (Hooks.call("blackFlag.preRollFormula", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.BasicRoll.build(rollConfig, dialogConfig, messageConfig);
		if (!rolls) return;

		/**
		 * A hook event that fires after the formula has been rolled.
		 * @function blackFlag.postRollFormula
		 * @memberof hookEvents
		 * @param {BasicRoll[]} rolls - The resulting rolls.
		 * @param {object} [data]
		 * @param {Activity} [data.subject] - Activity for which the roll was performed.
		 */
		Hooks.callAll("blackFlag.postRollFormula", rolls, { subject: this });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle rolling the formula attached to this utility.
	 * @this {UtilityActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	static #rollFormula(event, target, message) {
		this.rollFormula({ event });
	}
}
