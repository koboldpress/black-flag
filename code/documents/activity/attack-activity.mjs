import AttackRollConfigurationDialog from "../../applications/dice/attack-configuration-dialog.mjs";
import { AttackData } from "../../data/activity/attack-data.mjs";
import { buildRoll, getTargetDescriptors, numberFormat, simplifyFormula } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for rolling attacks and damage.
 */
export default class AttackActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

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
				(abilities[ability]?.mod ?? -Infinity) > (abilities[largest]?.mod ?? -Infinity) ? ability : largest,
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
		return super.hasDamage || (this.system.damage.includeBase && !!this.item.system.damage?.base?.formula);
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

	/** @override */
	async _triggerSubsequentActions(config, results) {
		this.rollAttack({ event: config.event });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * @typedef {ChallengeRollProcessConfiguration} AttackRollProcessConfiguration
	 * @property {string} attackMode - Method used for the attack (e.g. "oneHanded", "twoHanded", "offhand", "thrown").
	 */

	/**
	 * @typedef {ChallengeRollDialogConfiguration} AttackRollDialogConfiguration
	 * @property {AttackRollConfigurationDialogOptions} [options] - Configuration options.
	 */

	/**
	 * @typedef {object} AmmunitionUpdate
	 * @property {string} id        ID of the ammunition item to update.
	 * @property {boolean} destroy  Will the ammunition item be deleted?
	 * @property {number} quantity  New quantity after the ammunition is spent.
	 */

	/**
	 * Roll an attack.
	 * @param {AttackRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {AttackRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollAttack(config = {}, dialog = {}, message = {}) {
		const targets = getTargetDescriptors();
		const flagKey = `relationship.last.${this.id}`;

		let ammunitionOptions;
		if (this.item.system.properties?.has("ammunition") && this.actor)
			ammunitionOptions = this.actor.items
				.filter(
					i =>
						i.type === "ammunition" &&
						(!this.item.system.ammunition?.type || i.system.type.category === this.item.system.ammunition?.type)
				)
				.map(i => ({
					value: i.id,
					label: `${i.name} (${numberFormat(i.system.quantity)})`,
					disabled: !i.system.quantity
				}))
				.sort((lhs, rhs) => lhs.label.localeCompare(rhs.label, game.i18n.lang));

		const prepareAttackRoll = (process, rollConfig, formData, index) => {
			const { parts, data } = this.getAttackDetails(process);
			if (rollConfig.data?.situational) {
				parts.push("@situational");
				data.situational = rollConfig.data.situational;
			}

			const modifierData = foundry.utils.mergeObject(this.modifierData, {
				attackMode: process.attackMode
			});

			const threshold = Math.min(
				this.actor?.system.mergeModifiers?.(this.actor?.system.getModifiers?.(modifierData, "critical-threshold"), {
					mode: "smallest",
					rollData: data
				}) ?? Infinity,
				this.system.attack.critical.threshold ?? Infinity
			);

			foundry.utils.mergeObject(rollConfig, {
				data,
				parts,
				options: {
					minimum: this.actor?.system.buildMinimum?.(this.actor?.system.getModifiers?.(modifierData, "min"), {
						rollData: data
					})
				}
			});
			if (Number.isFinite(threshold)) rollConfig.options.criticalSuccess = threshold;
			if (targets.length === 1) rollConfig.options.target = targets[0].ac;

			return { rollConfig, rollNotes: this.actor?.system.getModifiers?.(modifierData, "note") };
		};

		const useAmmo = config.ammunition !== false && ammunitionOptions?.length;
		const rollConfig = foundry.utils.mergeObject(
			{
				ammunition: useAmmo
					? this.item.getFlag(game.system.id, `${flagKey}.ammunition`) ?? ammunitionOptions[0].value
					: undefined,
				attackMode: this.item.getFlag(game.system.id, `${flagKey}.attackMode`) ?? this.item.system.attackModes[0]?.value
			},
			config
		);
		const { rollConfig: roll, rollNotes } = prepareAttackRoll(rollConfig, {});
		rollConfig.subject = this;
		rollConfig.rolls = [roll].concat(config.rolls ?? []);

		const dialogConfig = foundry.utils.mergeObject(
			{
				applicationClass: AttackRollConfigurationDialog,
				options: {
					ammunitionOptions: rollConfig.ammunition !== false ? ammunitionOptions : undefined,
					attackModes: this.item.system.attackModes,
					buildConfig: prepareAttackRoll,
					rollNotes,
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
							...this.messageFlags,
							messageType: "roll",
							roll: { type: "attack" },
							targets
						}
					}
				},
				preCreate: (rolls, config, message) => {
					let attackMode = config.attackMode;
					const modes = this.item.system.attackModes;
					if (modes.length && !attackMode) attackMode = modes[0].value;
					if (attackMode) {
						rollConfig.attackMode = attackMode;
						foundry.utils.setProperty(message, `data.flags.${game.system.id}.roll.attackMode`, attackMode);
						if (attackMode in CONFIG.BlackFlag.attackModes)
							message.data.flavor = `${message.data.flavor} (${CONFIG.BlackFlag.attackModes.localized[
								attackMode
							].toLowerCase()})`;
					}
					rollConfig.ammunition = config.ammunition;
					if (config.ammunition) {
						foundry.utils.setProperty(message, `data.flags.${game.system.id}.roll.ammunition`, config.ammunition);
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before an attack is rolled.
		 * @function blackFlag.preRollAttack
		 * @memberof hookEvents
		 * @param {AttackRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {AttackRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollAttack", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);
		if (!rolls?.length) return;

		const flags = {};
		const ammo = this.actor?.items.get(rollConfig.ammunition);
		let ammoUpdate = null;
		if (ammo) {
			ammoUpdate = { id: ammo.id, quantity: Math.max(0, ammo.system.quantity - 1) };
			flags.ammunition = ammo.id;
		}
		if (rollConfig.attackMode) flags.attackMode = rollConfig.attackMode;
		if (!foundry.utils.isEmpty(flags)) await this.item.setFlag(game.system.id, flagKey, flags);

		/**
		 * A hook event that fires after an attack has been rolled, but before ammunition is updated.
		 * @function blackFlag.rollAttack
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} [data]
		 * @param {AmmunitionUpdate|null} [data.ammoUpdate] - Any updates related to ammo consumption for the attack.
		 * @param {Activity} [data.subject] - Activity for which the roll was performed.
		 */
		Hooks.callAll("blackFlag.rollAttack", rolls, { ammoUpdate, subject: this });

		if (ammoUpdate)
			await this.actor?.updateEmbeddedDocuments("Item", [
				{ _id: ammoUpdate.id, "system.quantity": ammoUpdate.quantity }
			]);

		/**
		 * A hook event that fires after an attack has been rolled.
		 * @function blackFlag.postRollAttack
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} [data]
		 * @param {Activity} [data.subject] - Activity for which the roll was performed.
		 */
		Hooks.callAll("blackFlag.postRollAttack", rolls, { subject: this });

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
		const lastAttack = message.getAssociatedRolls("attack").pop();
		const attackMode = lastAttack?.getFlag(game.system.id, "roll.attackMode");

		// Fetch ammunition used with last attack roll
		let ammunition;
		const actor = lastAttack?.getAssociatedActor();
		if (actor) ammunition = actor.items.get(lastAttack.getFlag(game.system.id, "roll.ammunition"));

		this.rollDamage({ ammunition, attackMode, event });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Attack details for this activity.
	 * @param {Partial<AttackRollProcessConfiguration>} [config={}] - Attack roll configuration.
	 * @returns {{parts: string[], data: object, formula: string, activity: Activity}|null}
	 */
	getAttackDetails(config = {}) {
		const ability = this.actor?.system.abilities?.[this.ability];
		const ammunition = this.actor?.items.get(config.ammunition);
		const rollData = this.item.getRollData();
		const { parts, data } = buildRoll(
			this.system.attack.flat
				? { toHit: this.system.attack.bonus }
				: {
						mod: ability?.adjustedMod ?? ability?.mod,
						prof: this.system.attackProficiency?.term,
						bonus: this.system.attack.bonus,
						weaponMagic: this.item.system.attackMagicalBonus,
						ammoMagic: ammunition?.system.attackMagicalBonus,
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

		// Handle ammunition
		const ammo = config.ammunition?.system;
		if (ammo) {
			// TODO: Set magical property on damage parts once supported

			// Add the ammunition's damage
			if (ammo.damage.base.formula) {
				const basePartIndex = rollConfig.rolls.findIndex(i => i.base);
				const damage = ammo.damage.base.clone();
				const rollData = this.getRollData();

				// If mode is "replace" and base part is present, replace the base part
				if (ammo.damage.replace && basePartIndex !== -1) {
					damage.base = true;
					const index = basePartIndex;
					rollConfig.rolls.splice(index, 1, this._processDamagePart(damage, config, rollData, { index }));
				}

				// Otherwise stick the ammo damage after base part (or as first part)
				else {
					damage.ammo = true;
					const index = basePartIndex + 1;
					rollConfig.rolls.splice(index, 0, this._processDamagePart(damage, rollConfig, rollData, { index }));
				}
			}
		}

		if (this.system.damage.critical.bonus) {
			rollConfig.critical ??= {};
			rollConfig.critical.bonusDamage ??= this.system.damage.critical.bonus;
		}

		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processDamagePart(damage, rollConfig, rollData, { modifierData = {}, ...config } = {}) {
		if (!damage.base) return super._processDamagePart(damage, rollConfig, rollData, { ...config, modifierData });

		// Swap base damage for versatile if two-handed attack is made on versatile weapon
		if (this.item.system.properties?.has("versatile") && rollConfig.attackMode === "twoHanded") {
			damage = this.item.system.versatileDamage ?? damage;
		}

		const roll = super._processDamagePart(damage, rollConfig, rollData, {
			...config,
			modifierData: { ...modifierData, baseDamage: true }
		});
		roll.base = true;

		if (this.item.type === "weapon") {
			// Add `@mod` unless it is an off-hand attack with a positive modifier
			if (!["offhand", "thrownOffhand"].includes(rollConfig.attackMode) || roll.data.mode < 0) roll.parts.push("@mod");

			// Add magical bonus
			if (this.item.system.damageMagicalBonus) {
				roll.data.weaponMagic = this.item.system.damageMagicalBonus;
				roll.parts.push("@weaponMagic");
			}

			// Add ammunition bonus
			const ammo = rollConfig.ammunition?.system;
			if (ammo?.damageMagicalBonus) {
				roll.data.ammoMagic = ammo.damageMagicalBonus;
				roll.parts.push("@ammoMagic");
			}
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
