import { HealingData } from "../../data/activity/healing-data.mjs";
import { buildRoll, simplifyFormula } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

export default class HealingActivity extends Activity {
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "healing",
				dataModel: HealingData,
				icon: "systems/black-flag/artwork/activities/healing.svg",
				title: "BF.Activity.Healing.Title",
				hint: "BF.Activity.Healing.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can healing be scaled for this activity? Requires either "Allow Scaling" to be checked or to be on a spell.
	 * @type {boolean}
	 */
	get allowDamageScaling() {
		return this.isSpell || this.consumption.scale.allowed;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the effect column in the action table.
	 * @type {string}
	 */
	get effectColumn() {
		const layout = document.createElement("div");
		layout.classList.add("layout");
		const rollConfig = this.createHealingConfig({}, this.item.getRollData({ deterministic: true }));
		let formula = rollConfig.rolls.map(r => r.parts.join(" + ")).join(" + ");
		formula = Roll.defaultImplementation.replaceFormulaData(formula, rollConfig.rolls[0]?.data ?? {});
		formula = simplifyFormula(formula);
		if (formula) {
			const healingType = CONFIG.BlackFlag.healingTypes[rollConfig.rolls[0].options.healingType];
			layout.innerHTML += `<span class="healing">${formula} ${game.i18n.localize(healingType?.label ?? "")}</span>`;
		}
		return layout.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability that can be added to healing using `@mod`.
	 * @type {string|null}
	 */
	get healingAbility() {
		if (this.system.ability) return this.system.ability;
		return this.item.system.ability ?? null;
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
		if (this.system.healing.formula)
			context.buttons = {
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
	 * Roll damage.
	 * @param {DamageRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {BasicRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<DamageRoll[]|void>}
	 */
	async rollDamage(config = {}, dialog = {}, message = {}) {
		return this.rollHealing(config, dialog, message);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll healing.
	 * @param {DamageRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {BasicRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<DamageRoll[]|void>}
	 */
	async rollHealing(config = {}, dialog = {}, message = {}) {
		const rollData = this.item.getRollData();
		const rollConfig = this.createHealingConfig(config, rollData);

		const dialogConfig = foundry.utils.mergeObject({
			options: {
				rollNotes: this.actor?.system.getModifiers?.(rollConfig.modifierData, "note"),
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
			}
		});

		const messageConfig = foundry.utils.mergeObject(
			{
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
			},
			message
		);

		/**
		 * A hook event that fires before healing is rolled.
		 * @function blackFlag.preRollHealing
		 * @memberof hookEvents
		 * @param {DamageRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @param {Activity} [activity] - Activity performing the roll.
		 * @returns {boolean} - Explicitly return false to prevent the roll from being performed.
		 */
		if (Hooks.call("blackFlag.preRollHealing", rollConfig, dialogConfig, messageConfig, this) === false) return;

		const rolls = await CONFIG.Dice.DamageRoll.build(rollConfig, dialogConfig, messageConfig);
		if (!rolls) return;

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
	 * @param {DamageRollProcessConfiguration} [config] - Custom config provided when calling rollHealing.
	 * @param {object} [rollData] - Item's starting roll data.
	 * @returns {DamageRollProcessConfiguration}
	 */
	createHealingConfig(config, rollData) {
		config ??= {};
		rollData = this.item.getRollData();

		const healing = this.system.healing;
		const modifierData = { ...this.modifierData, type: "healing", healing };
		const { parts, data } = buildRoll(
			{
				bonus: this.actor?.system.buildBonus?.(this.actor?.system.getModifiers?.(modifierData), { rollData })
			},
			rollData
		);

		const rollConfig = foundry.utils.mergeObject({ allowCritical: false }, config);
		rollConfig.scaling = rollData.scaling?.increase ?? 0;
		rollConfig.rolls = [
			{
				data,
				parts: [healing.scaledFormula(rollConfig.scaling ?? 0), ...(parts ?? [])],
				options: {
					damageType: healing.type,
					modifierData,
					minimum: this.actor?.system.buildMinimum?.(
						this.actor?.system.getModifiers?.(this.modifierData, "min", { rollData })
					)
				}
			}
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
