import { AttackData } from "../../data/activity/attack-data.mjs";
import { buildRoll, numberFormat } from "../../utils/_module.mjs";
import DamageActivity from "./damage-activity.mjs";

export default class AttackActivity extends DamageActivity {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "attack",
				dataModel: AttackData,
				icon: "systems/black-flag/artwork/activities/attack.svg",
				title: "BF.Activity.Attack.Title",
				hint: "BF.Activity.Attack.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability used to make attack rolls for this activity.
	 * @type {string|null}
	 */
	get attackAbility() {
		if (this.system.ability === "none") return null;
		if (this.system.ability) return this.system.ability;
		if (this.item.system.ability) return this.item.system.ability;
		const availableAbilities = this.system.availableAbilities;
		const abilities = this.actor?.system.abilities ?? {};
		return availableAbilities.reduce(
			(largest, ability) =>
				(abilities[ability]?.adjustedMod ?? abilities[ability]?.mod ?? -Infinity) >
				(abilities[largest]?.adjustedMod ?? abilities[largest]?.mod ?? -Infinity)
					? ability
					: largest,
			availableAbilities.first()
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the challenge column in the action table.
	 * @type {string}
	 */
	get challengeColumn() {
		const layout = document.createElement("div");
		layout.classList.add("layout");
		layout.innerHTML = numberFormat(this.system.toHit, { sign: true });
		return layout.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get damageAbility() {
		return this.attackAbility;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get hasDamage() {
		return super.hasDamage || (this.system.damage.includeBaseDamage && !!this.item.system.damage?.formula);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get modifierData() {
		return {
			type: "attack",
			kind: "attack",
			ability: this.attackAbility,
			...super.modifierData
		};
	}

	// TODO: Prepare proper title like "Melee Weapon Attack"

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for item activation.
	 * @returns {object}
	 */
	async activationChatContext() {
		const context = await super.activationChatContext();
		context.buttons = {
			attack: {
				label: game.i18n.localize("BF.Activity.Attack.Title"),
				dataset: { action: "roll", method: "rollAttack" }
			}
		};
		if (this.hasDamage)
			context.buttons.damage = {
				label: game.i18n.localize("BF.Damage.Label"),
				dataset: { action: "roll", method: "rollDamage" }
			};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll an attack.
	 * @param {ChallengeRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {ChallengeRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollAttack(config = {}, dialog = {}, message = {}) {
		// TODO: Associate ammunition with the attack

		const { parts, data } = this.getAttackDetails();

		const rollConfig = foundry.utils.deepClone(config);
		rollConfig.origin = this;
		rollConfig.rolls = [
			{
				parts,
				data,
				options: {
					criticalSuccess: this.actor?.system.mergeModifiers?.(
						this.actor?.system.getModifiers?.(this.modifierData, "critical-threshold"),
						{ mode: "smallest", rollData: data }
					),
					minimum: this.actor?.system.buildMinimum?.(this.actor?.system.getModifiers?.(this.modifierData, "min"), {
						rollData: data
					})
				}
			}
		].concat(config.rolls ?? []);

		const dialogConfig = foundry.utils.mergeObject({
			options: {
				rollNotes: this.actor?.system.getModifiers?.(this.modifierData, "note"),
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
			}
		});

		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${this.name}: ${this.item.actor?.name ?? ""}`,
					flavor: this.name,
					speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
					"flags.black-flag.roll": {
						type: "attack",
						origin: this.uuid
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before an attack is rolled.
		 * @function blackFlag.preRollAttack
		 * @memberof hookEvents
		 * @param {ChallengeRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {ChallengeRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollAttack", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);
		if (!rolls?.length) return;

		/**
		 * A hook event that fires after an attack has been rolled.
		 * @function blackFlag.postRollAttack
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity performing the attack.
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 */
		Hooks.callAll("blackFlag.postRollAttack", this, rolls);

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	createDamageConfigs(config, rollData) {
		const rollConfig = super.createDamageConfigs(config, rollData);
		rollConfig.rolls ??= [];
		if (this.system.damage.includeBaseDamage && this.item.system.damage) {
			const damage = (rollConfig.versatile ? this.item.system.versatileDamage : null) ?? this.item.system.damage;
			const modifierData = { ...this.modifierData, type: "damage", damage, baseDamage: true };
			const { parts, data } = buildRoll(
				{
					mod: this.damageModifier,
					bonus: this.actor?.system.buildBonus?.(this.actor?.system.getModifiers?.(modifierData), { rollData }),
					magic: this.item.system.damageMagicalBonus
				},
				rollData
			);
			rollConfig.rolls.unshift(
				foundry.utils.mergeObject(
					{
						data,
						modifierData,
						parts: [damage.formula, ...(parts ?? [])],
						options: {
							critical: {
								bonusDice: this.actor?.system.mergeModifiers?.(
									this.actor?.system.getModifiers?.(modifierData, "critical-dice"),
									{ deterministic: true, rollData }
								)
							},
							damageType: damage.type,
							minimum: this.actor?.system.buildMinimum?.(this.actor?.system.getModifiers?.(modifierData, "min"), {
								rollData: rollData
							})
						}
					},
					config
				)
			);
		}
		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Attack details for this activity.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{parts: string[], data: object, formula: string, activity: Activity}|null}
	 */
	getAttackDetails(options = {}) {
		const ability = this.actor?.system.abilities[this.attackAbility];
		const rollData = this.item.getRollData();
		const { parts, data } = buildRoll(
			this.system.attack.flat
				? { toHit: this.system.attack.bonus }
				: {
						mod: ability?.mod,
						prof: this.system.attackProficiency?.term,
						bonus: this.system.attack.bonus,
						magic: this.item.system.attackMagicalBonus,
						actorBonus: this.actor?.system.buildBonus?.(this.actor?.system.getModifiers?.(this.modifierData), {
							rollData
						})
					},
			rollData
		);
		return { parts, data, formula: Roll.replaceFormulaData(parts.join(" + "), data), activity: this };
	}
}
