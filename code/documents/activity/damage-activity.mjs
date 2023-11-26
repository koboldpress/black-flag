import { buildRoll } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

/**
 * Extension of standard activity for one that includes damage rolls.
 * @abstract
 */
export default class DamageActivity extends Activity {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll damage.
	 * @param {DamageRollConfiguration} [config] - Configuration information for the roll.
	 * @param {BaseMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @param {BaseDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise<DamageRoll[]|void>}
	 */
	async rollDamage(config={}, message={}, dialog={}) {
		const rollData = this.item.getRollData();
		const rollConfigs = this.createDamageConfigs(config, rollData);
		if ( rollConfigs.length ) rollConfigs[0].parts = rollConfigs[0].parts.concat(config.parts ?? []);

		const messageConfig = foundry.utils.mergeObject({
			data: {
				title: `${this.name}: ${this.item.actor?.name ?? ""}`,
				flavor: this.name,
				speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
				flags: {
					"black-flag": {
						type: "damage",
						activity: this.uuid
					}
				}
			}
		}, message);

		const allModifiers = rollConfigs.map(c => c.modifierData);
		const dialogConfig = foundry.utils.mergeObject({
			options: {
				rollNotes: this.actor?.system.getModifiers(allModifiers, "note"),
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
			}
		});

		/**
		 * A hook event that fires before a damage is rolled.
		 * @function blackFlag.preRollDamage
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity performing the roll.
		 * @param {DamageRollConfiguration} config - Configuration data for the pending roll.
		 * @param {BaseMessageConfiguration} message - Configuration data for the roll's message.
		 * @param {BaseDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @returns {boolean} - Explicitly return false to prevent the roll from being performed.
		 */
		if ( Hooks.call("blackFlag.preRollDamage", this, rollConfigs, messageConfig, dialogConfig) === false ) return;

		const rolls = await CONFIG.Dice.DamageRoll.build(rollConfigs, messageConfig, dialogConfig);
		if ( !rolls ) return;

		/**
		 * A hook event that fires after a damage has been rolled.
		 * @function blackFlag.postRollDamage
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity for which the roll was performed.
		 * @param {DamageRoll[]} rolls - The resulting rolls.
		 */
		Hooks.callAll("blackFlag.postRollDamage", this, rolls);

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create damage parts needed for the damage roll.
	 * @param {DamageRollConfiguration[]} config - Custom config provided when calling rollDamage.
	 * @param {object} rollData - Item's starting roll data.
	 * @returns {DamageRollConfiguration[]}
	 */
	createDamageConfigs(config, rollData) {
		const rollConfigs = [];
		for ( const damage of this.system.damage?.parts ?? [] ) {
			const modifierData = { ...this.modifierData, type: "damage", damage };
			const { parts, data } = buildRoll({
				bonus: this.actor?.system.buildBonus(this.actor?.system.getModifiers(modifierData), { rollData })
			}, rollData);
			rollConfigs.push(foundry.utils.mergeObject({
				data,
				modifierData,
				parts: damage.custom || [damage.formula, ...(parts ?? [])],
				options: {
					damageType: damage.type,
					minimum: this.actor?.system.buildMinimum(
						this.actor?.system.getModifiers(modifierData, "min"), { rollData: rollData }
					)
					// TODO: Get critical settings
				}
			}, config));
		}
		return rollConfigs;
	}
}
