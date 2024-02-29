import { buildRoll, simplifyFormula } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

/**
 * Extension of standard activity for one that includes damage rolls.
 * @abstract
 */
export default class DamageActivity extends Activity {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the effect column in the action table.
	 * @type {string}
	 */
	get effectColumn() {
		const layout = document.createElement("div");
		layout.classList.add("layout");
		const rollConfig = this.createDamageConfigs({}, this.item.getRollData({ deterministic: true }));
		for ( const roll of rollConfig.rolls ) {
			let formula = roll.parts.join(" + ");
			formula = Roll.defaultImplementation.replaceFormulaData(formula, roll.data);
			formula = simplifyFormula(formula);
			if ( formula ) {
				const damageType = CONFIG.BlackFlag.damageTypes[roll.options.damageType];
				layout.innerHTML += `<span class="damage">${formula} ${game.i18n.localize(damageType?.label ?? "")}</span>`;
			}
		}
		return layout.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Are any damage parts actually configured for this activity?
	 * @type {boolean}
	 */
	get hasDamage() {
		return this.system.damage?.parts?.length > 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll damage.
	 * @param {DamageRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {BasicRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<DamageRoll[]|void>}
	 */
	async rollDamage(config={}, dialog={}, message={}) {
		const rollData = this.item.getRollData();
		const rollConfig = this.createDamageConfigs(config, rollData);
		rollConfig.origin = this;

		const allModifiers = rollConfig.rolls?.map(c => c.modifierData) ?? [];
		const dialogConfig = foundry.utils.mergeObject({
			options: {
				rollNotes: this.actor?.system.getModifiers(allModifiers, "note"),
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
			}
		});

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

		/**
		 * A hook event that fires before damage is rolled.
		 * @function blackFlag.preRollDamage
		 * @memberof hookEvents
		 * @param {DamageRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @param {Activity} [activity] - Activity performing the roll.
		 * @returns {boolean} - Explicitly return false to prevent the roll from being performed.
		 */
		if ( Hooks.call("blackFlag.preRollDamage", rollConfig, dialogConfig, messageConfig, this) === false ) return;

		const rolls = await CONFIG.Dice.DamageRoll.build(rollConfig, dialogConfig, messageConfig);
		if ( !rolls ) return;

		/**
		 * A hook event that fires after damage has been rolled.
		 * @function blackFlag.postRollDamage
		 * @memberof hookEvents
		 * @param {DamageRoll[]} rolls - The resulting rolls.
		 * @param {Activity} [activity] - Activity for which the roll was performed.
		 */
		Hooks.callAll("blackFlag.postRollDamage", rolls, this);

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create damage parts needed for the damage roll.
	 * @param {DamageRollProcessConfiguration} config - Custom config provided when calling rollDamage.
	 * @param {object} rollData - Item's starting roll data.
	 * @returns {DamageRollProcessConfiguration}
	 */
	createDamageConfigs(config, rollData) {
		const rollConfig = foundry.utils.deepClone(config);
		rollConfig.rolls = [];
		for ( const damage of this.system.damage?.parts ?? [] ) {
			const modifierData = { ...this.modifierData, type: "damage", damage };
			const { parts, data } = buildRoll({
				bonus: this.actor?.system.buildBonus(this.actor?.system.getModifiers(modifierData), { rollData })
			}, rollData);
			rollConfig.rolls.push(foundry.utils.mergeObject({
				data,
				modifierData,
				parts: damage.custom ? [damage.custom] : [damage.formula, ...(parts ?? [])],
				options: {
					damageType: damage.type,
					minimum: this.actor?.system.buildMinimum(
						this.actor?.system.getModifiers(modifierData, "min"), { rollData: rollData }
					)
					// TODO: Get critical settings
				}
			}, config));
		}
		rollConfig.rolls.concat(config.rolls ?? []);
		return rollConfig;
	}
}
