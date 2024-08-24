import { AttackData } from "../../data/activity/attack-data.mjs";
import { buildRoll, numberFormat, simplifyFormula } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

export default class AttackActivity extends Activity {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "attack",
				dataModel: AttackData,
				icon: "systems/black-flag/artwork/activities/attack.svg",
				title: "BF.ATTACK.Label",
				hint: "BF.ATTACK.Hint",
				usage: {
					actions: {
						rollAttack: AttackActivity.#rollAttack,
						rollDamage: AttackActivity.#rollDamage
					}
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get ability() {
		if (this.system.attack.ability === "none") return null;
		if (this.system.attack.ability) return this.system.attack.ability;
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
	 * Ability used to make attack rolls for this activity.
	 * @type {string|null}
	 */
	get attackAbility() {
		foundry.utils.logCompatibilityWarning(
			"The `attackAbility` property on `AttackActivity` has been moved to `ability`",
			{ since: "Black Flag 0.10.042", until: "Black Flag 0.10.047" }
		);
		return this.system.ability;
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

	/** @inheritDoc */
	get hasDamage() {
		return super.hasDamage || (this.system.damage.includeBase && !!this.item.system.damage?.formula);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get modifierData() {
		return {
			type: "attack",
			kind: "attack",
			ability: this.ability,
			...super.modifierData
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_activationChatButtons() {
		const buttons = [
			{
				label: game.i18n.localize("BF.ATTACK.Label"),
				icon: "", // TODO: Figure out attack icon
				dataset: {
					action: "rollAttack"
				}
			}
		];
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
		const targets = this.constructor.getTargetDescriptors();

		const threshold = Math.min(
			this.actor?.system.mergeModifiers?.(this.actor?.system.getModifiers?.(this.modifierData, "critical-threshold"), {
				mode: "smallest",
				rollData: data
			}) ?? Infinity,
			this.system.attack.critical.threshold ?? Infinity
		);

		const rollConfig = foundry.utils.deepClone(config);
		rollConfig.origin = this;
		rollConfig.rolls = [
			{
				parts,
				data,
				options: {
					criticalSuccess: Number.isFinite(threshold) ? threshold : undefined,
					minimum: this.actor?.system.buildMinimum?.(this.actor?.system.getModifiers?.(this.modifierData, "min"), {
						rollData: data
					}),
					target: targets.length === 1 ? targets[0].ac : undefined
				}
			}
		].concat(config.rolls ?? []);

		const dialogConfig = foundry.utils.mergeObject(
			{
				options: {
					rollNotes: this.actor?.system.getModifiers?.(this.modifierData, "note"),
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
				}
			},
			dialog
		);

		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${this.name}: ${this.item.actor?.name ?? ""}`,
					flavor: this.name,
					speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
					flags: {
						[game.system.id]: {
							type: "attack",
							activity: this.uuid,
							targets
						}
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
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} [data]
		 * @param {Activity} [data.activity] - Activity for which the roll was performed.
		 */
		Hooks.callAll("blackFlag.postRollAttack", rolls, { activity: this });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle performing an attack roll.
	 * @this {AttackActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	static #rollAttack(event, target, message) {
		this.rollAttack({ event });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle performing a damage roll.
	 * @this {AttackActivity}
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

	/**
	 * Attack details for this activity.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{parts: string[], data: object, formula: string, activity: Activity}|null}
	 */
	getAttackDetails(options = {}) {
		const ability = this.actor?.system.abilities?.[this.ability];
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
		return {
			activity: this,
			data,
			formula: simplifyFormula(Roll.replaceFormulaData(parts.join(" + "), data), { deterministic: true }),
			parts
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * @typedef {AttackDamageRollProcessConfiguration} [config={}]
	 * @property {BlackFlagItem} ammunition                               Ammunition used with the attack.
	 * @property {"oneHanded"|"twoHanded"|"offhand"|"thrown"} attackMode  Attack mode.
	 */

	/**
	 * Get the roll parts used to create the damage rolls.
	 * @param {Partial<AttackDamageRollProcessConfiguration>} [config={}]
	 * @returns {AttackDamageRollProcessConfiguration}
	 */
	getDamageConfig(config = {}) {
		const rollConfig = super.getDamageConfig(config);

		// TODO: Handle ammunition

		if (this.system.damage.critical.bonus) {
			rollConfig.critical ??= {};
			rollConfig.critical.bonusDamage ??= this.system.damage.critical.bonus;
		}

		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processDamagePart(damage, rollConfig, rollData) {
		if (!damage.base) super._processDamagePart(damage, rollConfig, rollData);

		// Swap base damage for versatile if two-handed attack is made on versatile weapon
		if (this.item.system.properties?.has("versatile") && rollConfig.attackMode === "twoHanded") {
			damage = this.item.system.versatileDamage ?? damage;
		}

		const roll = super._processDamagePart(damage, rollConfig, rollData, { baseDamage: true });
		roll.base = true;

		if (this.item.type === "weapon") {
			// Remove `@mod` from off-hand attacks unless it is negative
			if (rollConfig.attackMode === "offHand" && roll.data.mode >= 0) roll.parts.findSplice("@mod");

			// Add magical bonus
			if (this.item.system.damageMagicalBonus) {
				roll.data.magic = this.item.system.damageMagicalBonus;
				roll.parts.push("@magic");
			}

			// TODO: Add ammunition bonus
		}

		foundry.utils.setProperty(
			roll,
			"options.critical.bonusDice",
			this.actor?.system.mergeModifiers?.(this.actor?.system.getModifiers?.(roll.modifierData, "critical-dice"), {
				deterministic: true,
				rollData
			})
		);

		return roll;
	}
}
