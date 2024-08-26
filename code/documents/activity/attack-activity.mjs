import AttackRollConfigurationDialog from "../../applications/dice/attack-configuration-dialog.mjs";
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
		const targets = this.constructor.getTargetDescriptors();

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
					// TODO: Fetch recently used attack mode
					criticalSuccess: Number.isFinite(threshold) ? threshold : undefined,
					minimum: this.actor?.system.buildMinimum?.(this.actor?.system.getModifiers?.(modifierData, "min"), {
						rollData: data
					}),
					target: targets.length === 1 ? targets[0].ac : undefined
				}
			});

			return { rollConfig, rollNotes: this.system.getModifiers?.(modifierData, "note") };
		};

		const rollConfig = foundry.utils.mergeObject(
			{
				// TODO: Fetch recently used ammunition options
				ammunition: config.ammunition !== false && ammunitionOptions ? ammunitionOptions[0].value : undefined,
				// TODO: Fetch recently used attack mode
				attackMode: this.item.system.attackModes[0]?.value
			},
			config
		);
		const { rollConfig: roll, rollNotes } = prepareAttackRoll(rollConfig, {});
		rollConfig.origin = this;
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

		const ammo = this.actor?.items.get(rollConfig.ammunition);
		let ammoUpdate = null;
		if (ammo) ammoUpdate = { id: ammo.id, quantity: Math.max(0, ammo.system.quantity - 1) };

		/**
		 * A hook event that fires after an attack has been rolled, but before ammunition is updated.
		 * @function blackFlag.rollAttack
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} [data]
		 * @param {Activity} [data.activity] - Activity for which the roll was performed.
		 * @param {AmmunitionUpdate|null} [data.ammoUpdate] - Any updates related to ammo consumption for the attack.
		 */
		Hooks.callAll("blackFlag.rollAttack", rolls, { activity: this, ammoUpdate });

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
						mod: ability?.mod,
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
					rollConfig.rolls.splice(basePartIndex, 1, this._processDamagePart(damage, config, rollData));
				}

				// Otherwise stick the ammo damage after base part (or as first part)
				else {
					damage.ammo = true;
					rollConfig.rolls.splice(basePartIndex + 1, 0, this._processDamagePart(damage, rollConfig, rollData));
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
	_processDamagePart(damage, rollConfig, rollData) {
		if (!damage.base) super._processDamagePart(damage, rollConfig, rollData);

		// Swap base damage for versatile if two-handed attack is made on versatile weapon
		if (this.item.system.properties?.has("versatile") && rollConfig.attackMode === "twoHanded") {
			damage = this.item.system.versatileDamage ?? damage;
		}

		const roll = super._processDamagePart(damage, rollConfig, rollData, { baseDamage: true });
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
