import { DamageData } from "../../data/activity/damage-data.mjs";
import { buildRoll, simplifyFormula } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

/**
 * Extension of standard activity for one that includes damage rolls.
 * @abstract
 */
export default class DamageActivity extends Activity {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "damage",
				dataModel: DamageData,
				icon: "systems/black-flag/artwork/activities/damage.svg",
				title: "BF.DAMAGE.Label",
				hint: "BF.DAMAGE.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can damage be scaled for this activity? Requires either "Allow Scaling" to be checked or to be on a spell.
	 * @type {boolean}
	 */
	get allowDamageScaling() {
		return this.isSpell || this.consumption.scale.allowed;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability used to calculate damage.
	 * @type {string|null}
	 */
	get damageAbility() {
		if (this.system.ability !== "spellcasting" || !this.actor) return this.system.ability ?? null;

		const abilities = Object.values(this.actor.system.spellcasting?.origins ?? {}).reduce((set, o) => {
			set.add(o.ability);
			return set;
		}, new Set());
		ability = this.actor.system.selectBestAbility?.(abilities);
		return ability ?? "intelligence";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Damage modifier with any adjustments applied.
	 * @type {number}
	 */
	get damageModifier() {
		const ability = this.actor?.system.abilities?.[this.damageAbility];
		if (!ability) return 0;
		return ability?.adjustedMod ?? ability?.mod;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the effect column in the action table.
	 * @type {string}
	 */
	get effectColumn() {
		const layout = document.createElement("div");
		layout.classList.add("layout");
		const rollConfig = this.createDamageConfigs({}, this.item.getRollData({ deterministic: true }));
		for (const roll of rollConfig.rolls) {
			let formula = roll.parts.join(" + ");
			formula = Roll.defaultImplementation.replaceFormulaData(formula, roll.data);
			formula = simplifyFormula(formula);
			if (formula) {
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
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for item activation.
	 * @returns {object}
	 */
	async _activationChatContext() {
		const context = await super._activationChatContext();
		if (this.hasDamage)
			context.buttons = {
				damage: {
					label: game.i18n.localize("BF.DAMAGE.Label"),
					dataset: { action: "roll", method: "rollDamage" }
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
		const rollData = this.item.getRollData();
		const rollConfig = this.createDamageConfigs(config, rollData);
		rollConfig.origin = this;

		const allModifiers = rollConfig.rolls?.map(c => c.modifierData) ?? [];
		const dialogConfig = foundry.utils.mergeObject({
			options: {
				rollNotes: this.actor?.system.getModifiers?.(allModifiers, "note"),
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
						[game.system.id]: {
							type: "damage",
							activity: this.uuid,
							targets: this.constructor.getTargetDescriptors()
						}
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before damage is rolled.
		 * @function blackFlag.preRollDamage
		 * @memberof hookEvents
		 * @param {DamageRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return false to prevent the roll from being performed.
		 */
		if (Hooks.call("blackFlag.preRollDamage", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.DamageRoll.build(rollConfig, dialogConfig, messageConfig);
		if (!rolls) return;

		/**
		 * A hook event that fires after damage has been rolled.
		 * @function blackFlag.postRollDamage
		 * @memberof hookEvents
		 * @param {DamageRoll[]} rolls - The resulting rolls.
		 * @param {object} [data]
		 * @param {Activity} [data.activity] - Activity for which the roll was performed.
		 */
		Hooks.callAll("blackFlag.postRollDamage", rolls, { activity: this });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create damage parts needed for the damage roll.
	 * @param {DamageRollProcessConfiguration} [config] - Custom config provided when calling rollDamage.
	 * @param {object} [rollData] - Item's starting roll data.
	 * @returns {DamageRollProcessConfiguration}
	 */
	createDamageConfigs(config, rollData) {
		config ??= {};
		rollData = this.item.getRollData();
		rollData.mod = this.damageModifier;

		const rollConfig = foundry.utils.deepClone(config);
		rollConfig.scaling = rollData.scaling?.increase ?? 0;
		rollConfig.rolls = [];

		for (const damage of this.system.damage?.parts ?? []) {
			const modifierData = { ...this.modifierData, type: "damage", damage };
			const { parts, data } = buildRoll(
				{
					bonus: this.actor?.system.buildBonus?.(this.actor?.system.getModifiers?.(modifierData), { rollData })
				},
				rollData
			);
			const scaledFormula = damage.scaledFormula(rollConfig.scaling ?? 0);
			if (scaledFormula) parts.unshift(scaledFormula);
			if (!parts.length) continue;
			rollConfig.rolls.push(
				foundry.utils.mergeObject(
					{
						data,
						modifierData,
						parts,
						options: {
							damageType: damage.type,
							damageTypes: damage.type === "variable" ? damage.additionalTypes : undefined,
							minimum: this.actor?.system.buildMinimum?.(this.actor?.system.getModifiers?.(modifierData, "min"), {
								rollData
							})
						}
					},
					config
				)
			);
		}
		rollConfig.rolls.concat(config.rolls ?? []);

		if (this.system.damage?.allowCritical === false) rollConfig.allowCritical ??= false;

		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Damage formulas and activity.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{rolls: DamageRollConfiguration[], activity: Activity}|null}
	 */
	getDamageDetails(options = {}) {
		return { rolls: this.createDamageConfigs({ versatile: options.versatile }).rolls, activity: this };
	}
}
