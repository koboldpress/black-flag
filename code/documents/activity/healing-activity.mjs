import { HealingData } from "../../data/activity/healing-data.mjs";
import { buildRoll, simplifyFormula } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

export default class HealingActivity extends Activity {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "healing",
		dataModel: HealingData,
		icon: "systems/black-flag/artwork/activities/healing.svg",
		title: "BF.Activity.Healing.Title",
		hint: "BF.Activity.Healing.Hint"
	}, {inplace: false}));

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
		const rollConfig = this.createHealingConfig({}, this.item.getRollData({ deterministic: true }));
		let formula = rollConfig.parts.join(" + ");
		formula = Roll.defaultImplementation.replaceFormulaData(formula, rollConfig.data);
		formula = simplifyFormula(formula);
		if ( formula ) {
			const healingType = CONFIG.BlackFlag.healingTypes[rollConfig.options.healingType];
			layout.innerHTML += `<span class="healing">${formula} ${game.i18n.localize(healingType?.label ?? "")}</span>`;
		}
		return layout.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for item activation.
	 * @returns {object}
	 */
	async activationChatContext() {
		const context = await super.activationChatContext();
		if ( this.system.healing.formula ) context.buttons = {
			damage: {
				label: game.i18n.localize("BF.Healing.Label"),
				dataset: { action: "roll", method: "rollHealing" }
			}
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll healing.
	 * @param {DamageRollConfiguration} [config] - Configuration information for the roll.
	 * @param {BaseMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @param {BaseDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise<DamageRoll[]|void>}
	 */
	async rollHealing(config={}, message={}, dialog={}) {
		const rollData = this.item.getRollData();
		const rollConfig = this.createHealingConfig(config, rollData);

		const messageConfig = foundry.utils.mergeObject({
			data: {
				title: `${this.name}: ${this.item.actor?.name ?? ""}`,
				flavor: this.name,
				speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
				flags: {
					"black-flag": {
						type: "healing",
						activity: this.uuid
					}
				}
			}
		}, message);

		const dialogConfig = foundry.utils.mergeObject({
			options: {
				rollNotes: this.actor?.system.getModifiers(rollConfig.modifierData, "note"),
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
			}
		});

		/**
		 * A hook event that fires before healing is rolled.
		 * @function blackFlag.preRollHealing
		 * @memberof hookEvents
		 * @param {DamageRollConfiguration} config - Configuration data for the pending roll.
		 * @param {BaseMessageConfiguration} message - Configuration data for the roll's message.
		 * @param {BaseDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {Activity} [activity] - Activity performing the roll.
		 * @returns {boolean} - Explicitly return false to prevent the roll from being performed.
		 */
		if ( Hooks.call("blackFlag.preRollHealing", rollConfig, messageConfig, dialogConfig, this) === false ) return;

		const rolls = await CONFIG.Dice.DamageRoll.build([rollConfig], messageConfig, dialogConfig);
		if ( !rolls ) return;

		/**
		 * A hook event that fires after healing has been rolled.
		 * @function blackFlag.postRollHealing
		 * @memberof hookEvents
		 * @param {DamageRoll[]} rolls - The resulting rolls.
		 * @param {Activity} [activity] - Activity for which the roll was performed.
		 */
		Hooks.callAll("blackFlag.postRollHealing", rolls, this);

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create parts needed for the healing roll.
	 * @param {DamageRollConfiguration[]} config - Custom config provided when calling rollHealing.
	 * @param {object} rollData - Item's starting roll data.
	 * @returns {DamageRollConfiguration}
	 */
	createHealingConfig(config, rollData) {
		const ability = this.actor?.system.abilities[this.system.ability];
		// TODO: Automatically select spellcasting ability if on a spell
		const healing = this.system.healing;
		const modifierData = { ...this.modifierData, type: "healing", healing };
		const { parts, data } = buildRoll({
			mod: ability?.mod,
			bonus: this.actor?.system.buildBonus(this.actor?.system.getModifiers(modifierData), { rollData })
		}, rollData);

		const rollConfig = foundry.utils.mergeObject({
			data,
			parts: healing.custom ? [healing.custom] : [healing.formula, ...(parts ?? [])],
			options: {
				allowCritical: false,
				healingType: healing.type,
				modifierData,
				minimum: this.actor?.system.buildMinimum(
					this.actor?.system.getModifiers(this.modifierData, "min", { rollData })
				)
			}
		}, config);
		rollConfig.parts = rollConfig.parts.concat(config.parts ?? []);

		return rollConfig;
	}
}