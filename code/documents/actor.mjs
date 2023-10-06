import { buildRoll, log, numberFormat } from "../utils/_module.mjs";
import { DocumentMixin } from "./mixin.mjs";
import NotificationsCollection from "./notifications.mjs";

export default class BlackFlagActor extends DocumentMixin(Actor) {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Collection of notifications that should be displayed on the actor sheet.
	 */
	notifications = this.notifications;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An object that tracks which tracks the changes to the data model which were applied by advancement.
	 * @type {object}
	 */
	advancementOverrides = this.advancementOverrides ?? {};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareData() {
		this.notifications = new NotificationsCollection();
		super.prepareData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	applyActiveEffects() {
		this.system.prepareEmbeddedData?.();
		this.applyAdvancementEffects();
		return super.applyActiveEffects();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply any transformations to the Actor which are caused by dynamic Advancement.
	 */
	applyAdvancementEffects() {
		const cls = getDocumentClass("ActiveEffect");
		const applier = new cls({ name: "temp" });
		const overrides = {};

		const levels = Array.fromRange(Object.keys(this.system.progression?.levels ?? {}).length + 1);
		for ( const level of levels ) {
			for ( const advancement of this.advancementForLevel(level) ) {
				advancement.changes({character: level, class: level})?.map(change => {
					const c = foundry.utils.deepClone(change);
					c.advancement = advancement;
					c.priority ??= c.mode * 10;
					return c;
				})
					.sort((lhs, rhs) => lhs.priority - rhs.priority)
					.forEach(c => Object.assign(overrides, applier.apply(this, c)));
			}
		}

		this.advancementOverrides = foundry.utils.expandObject(overrides);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get advancement for the actor.
	 * @param {number} level - Level for which to get the advancement.
	 * @yields {Advancement}
	 */
	*advancementForLevel(level=0) {
		// TODO: Rework to support different character/class levels
		for ( const item of this.items ) {
			for ( const advancement of item.advancementForLevel(level) ) {
				yield advancement;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Description of a source of damage.
	 *
	 * @typedef {object} DamageDescription
	 * @property {number} value - Amount of damage.
	 * @property {string} type - Type of damage.
	 * @property {BlackFlagActor|BlackFlagItem} [source] - Source of the damage.
	 */

	/**
	 * Apply damage to the actor.
	 * @param {DamageDescription[]|number} damage - Damages to apply.
	 * @param {object} [options={}]
	 * @param {number} [options.multiplier=1] - Amount by which to multiply all damage (before damage resistance, etc).
	 * @param {object} [options.ignore]
	 * @param {boolean} [options.ignore.all=false] - Should all damage modification be ignored?
	 * @param {boolean} [options.ignore.immunity=false] - Should this actor's damage immunity be ignored?
	 * @param {boolean} [options.ignore.reduction=false] - Should this actor's damage reduction be ignored?
	 * @param {boolean} [options.ignore.resistance=false] - Should this actor's damage resistance be ignored?
	 * @param {boolean} [options.ignore.vulnerability=false] - Should this actor's damage vulnerability be ignored?
	 * @returns {Promise<BlackFlagActor>} - The actor after the update has been performed.
	 */
	async applyDamage(damage, options={}) {
		const hp = this.system.attributes.hp;
		if ( !hp ) return;

		if ( Number.isNumeric(damage) ) {
			damage = [{ value: damage }];
			options.ignore ??= { all: true };
		}

		let inverted = false;
		let multiplier = options.multiplier ?? 1;

		// TODO: Pre-apply damage hook

		if ( multiplier < 0 ) {
			inverted = true;
			multiplier *= -1;
		}

		let amount = damage.reduce((total, d) => {
			// TODO: Ignore damage types with immunity

			// Apply damage multiplier
			let value = d.value * multiplier;

			// TODO: Apply type-specific damage resistances & vulnerabilities

			// TODO: Apply type-specific damage reduction, ensuring damage reduction doesn't cause healing by accident

			return total + value;
		}, 0);

		// TODO: Apply overall damage resistance & vulnerability

		// TODO: Apply overall damage reduction

		// Round damage down
		amount = Math.floor(amount);

		// Invert damage if multiplier is negative
		if ( inverted ) amount *= -1;

		// Subtract from temp HP first & then from normal HP
		const deltaTemp = amount > 0 ? Math.min(hp.temp, amount) : 0;
		const deltaHP = Math.clamped(amount - deltaTemp, -(hp.damage ?? Infinity), hp.value);
		const updates = {
			"system.attributes.hp.temp": hp.temp - deltaTemp,
			"system.attributes.hp.value": hp.value - deltaHP
		};
		amount = deltaTemp + deltaHP;

		// TODO: Apply damage hook

		// Call core's hook so anything watching token bar changes can respond
		if ( Hooks.call("modifyTokenAttribute", {
			attribute: "attributes.hp", value: amount, isDelta: false, isBar: true
		}, updates) === false ) return false;

		if ( !deltaTemp && !deltaHP ) return false;
		return this.update(updates, { deltaHP: -amount });
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Apply temp HP to the actor, but only if it's more than the actor's current temp HP.
	 * @param {number} amount - Amount of temp HP to apply.
	 * @returns {Promise<ActorEH>} - The actor after the update has been performed.
	 */
	async applyTempHP(amount=0) {
		const hp = this.system.attributes.hp;
		if ( !hp ) return;
		return amount > hp.temp ? this.update({"system.attributes.hp.temp": amount}) : this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async modifyTokenAttribute(attribute, value, isDelta, isBar) {
		if ( ["attributes.hp", "attributes.hp.value"].includes(attribute) ) {
			const hp = this.system.attributes.hp;
			const delta = isDelta ? (-1 * value) : (hp.value + hp.temp) - value;
			return this.applyDamage(delta);
		}
		return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Resting               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration options for a rest.
	 *
	 * @typedef {object} RestConfiguration
	 * @property {string} type - Type of rest performed (e.g. "short" or "long").
	 * @property {boolean} dialog - Present a dialog window for any rest configuration.
	 * @property {boolean} chat - Should a chat message be created to summarize the results of the rest?
	 */

	/**
	 * Results from a rest operation.
	 *
	 * @typedef {object} RestResult
	 * @property {string} type - Type of rest performed (e.g. "short" or "long").
	 * @property {object} deltas
	 * @property {number} deltas.hitPoints - Hit points recovered during the rest.
	 * @property {object} deltas.hitDice - Hit dice spent or recovered during the rest, grouped by size.
	 * @property {number} deltas.hitDice.total - Combined hit dice delta.
	 * @property {object} actorUpdates - Updates applied to the actor.
	 * @property {object[]} itemUpdates - Updates applied to the actor's items.
	 * @property {BaseRoll[]} rolls - Any rolls that occurred during the rest process, not including hit dice.
	 */

	/**
	 * Take a short rest, possibly spending hit dice and recovering resources and item uses.
	 * @param {RestConfiguration} [config={}] - Configuration options for a short rest.
	 * @returns {Promise<RestResult|void>} - Final result of the rest operation.
	 */
	async shortRest(config={}) {
		return this.rest(foundry.utils.mergeObject({ type: "short" }, config));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Take a long rest, possibly recovering hit points, resources, and item uses.
	 * @param {RestConfiguration} [config={}] - Configuration options for a long rest.
	 * @returns {Promise<RestResult|void>} - Final result of the rest operation.
	 */
	async longRest(config={}) {
		return this.rest(foundry.utils.mergeObject({ type: "long" }, config));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform all of the changes needed when the actor rests.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {object} [deltas={}] - Any changes that have been made earlier in the process.
	 * @returns {Promise<RestResult>} - Final result of the rest operation.
	 */
	async rest(config={}, deltas={}) {
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		if ( !restConfig ) return ui.notifications.error(`Rest type ${config.type} was not defined in configuration.`);
		config = foundry.utils.mergeObject({ dialog: true, chat: true }, config);

		const initialHitDice = Object.entries(this.system.attributes.hd.d).reduce((obj, [d, v]) => {
			obj[d] = v.spent;
			return obj;
		}, {});
		const initialHitPoints = this.system.attributes.hp.value;

		/**
		 * A hook event that fires before the rest dialog is shown.
		 * @function blackFlag.preRestConfiguration
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The actor that is being rested.
		 * @param {RestConfiguration} config - Configuration options for the rest.
		 * @returns {boolean} - Explicitly return `false` to prevent the rest from being started.
		 */
		if ( Hooks.call("blackFlag.preRestConfiguration", this, config) === false ) return;

		const result = {
			type: config.type,
			deltas: {},
			actorUpdates: {},
			itemUpdates: [],
			rolls: []
		};
		const RestDialog = config.dialog ? restConfig.dialogClass : null;
		if ( RestDialog ) {
			try { foundry.utils.mergeObject(result, await RestDialog.rest(this, config)); }
			catch(err) { return; }
		}

		/**
		 * A hook event that fires after the rest dialog is shown.
		 * @function blackFlag.restConfiguration
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The actor that is being rested.
		 * @param {RestConfiguration} config - Configuration options for the rest.
		 * @param {RestResult} result - Details on the rest to be completed.
		 * @returns {boolean} - Explicitly return `false` to prevent the rest from being continued.
		 */
		if ( Hooks.call("blackFlag.restConfiguration", this, config, result) === false ) return;

		let totalHD = 0;
		result.deltas.hitDice = Object.keys(this.system.attributes.hd.d).reduce((obj, d) => {
			obj[d] = (result.deltas.hitDice?.[d] ?? 0) + initialHitDice[d] - this.system.attributes.hd.d[d];
			totalHD += obj[d];
			return obj;
		}, {});
		result.deltas.hitDice.total = totalHD;
		result.deltas.hitPoints = (result.deltas.hitPoints ?? 0) + this.system.attributes.hp.value - initialHitPoints;

		this._getRestHitDiceRecovery(config, result);
		this._getRestHitPointRecovery(config, result);

		/**
		 * A hook event that fires after rest result is calculated, but before any updates are performed.
		 * @function blackFlag.preRestCompleted
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The actor that is being rested.
		 * @param {RestResult} result - Details on the rest to be completed.
		 * @returns {boolean} - Explicitly return `false` to prevent the rest updates from being performed.
		 */
		if ( Hooks.call("blackFlag.preRestCompleted", this, result) === false ) return result;

		await this.update(result.actorUpdates);
		await this.updateEmbeddedDocuments("Item", result.itemUpdates);

		if ( chat ) await this._displayRestResultMessage(result);

		/**
		 * A hook event that fires when the rest process is completed for an actor.
		 * @function blackFlag.restCompleted
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The actor that just completed resting.
		 * @param {RestResult} result - Details on the rest completed.
		 */
		Hooks.callAll("blackFlag.restCompleted", this, result);

		return result;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any hit dice recover needed for this rest.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {RestResult} [result={}] - Rest result being constructed.
	 * @internal
	 */
	_getRestHitDiceRecovery(config={}, result={}) {
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		if ( !restConfig.recoverHitDice ) return;
		// const hd = this.system.attributes.hd;
		// const final = Math.clamped(hd.spent - Math.ceil(hd.max * hd.recovery), 0, hd.max);
		// foundry.utils.mergeObject(result, {
		// 	deltas: {
		// 		hitDice: (result.deltas?.hitDice ?? 0) + hd.spent - final
		// 	},
		// 	actorUpdates: {
		// 		"system.attributes.hd.spent": final
		// 	}
		// });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any hit point recovery needed for this rest.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {RestResult} [result={}] - Rest result being constructed.
	 * @internal
	 */
	_getRestHitPointRecovery(config={}, result={}) {
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		if ( !restConfig.recoverHitPoints ) return;
		const hp = this.system.attributes.hp;
		const percentage = CONFIG.BlackFlag.rest.hitPointsRecoveryPercentage;
		const final = Math.clamped(hp.value + Math.ceil(hp.max * percentage), 0, hp.max);
		foundry.utils.mergeObject(result, {
			deltas: {
				hitPoints: (result.deltas?.hitPoints ?? 0) + hp.damage - final
			},
			actorUpdates: {
				"system.attributes.hp.value": final,
				"system.attributes.hp.temp": 0
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the result of a rest operation in chat.
	 * @param {RestResult} result - Results of the rest.
	 * @returns {Promise<ChatMessage>}
	 * @internal
	 */
	async _displayRestResultMessage(result) {
		const restConfig = CONFIG.BlackFlag.rest.types[result.type];

		// Determine what localization string should be used for the message content
		let resultType = "Basic";
		if ( result.deltas.hitPoints && result.deltas.hitDice.total ) resultType = "Full";
		else if ( (result.type === "long") && result.deltas.hitPoints ) resultType = "HitPoints";
		else if ( (result.type === "long") && result.deltas.hitDice.total ) resultType = "HitDice";
		const localizationString = `${restConfig.resultMessages}.${resultType}`;

		// Prepare localization data
		const pluralRules = new Intl.PluralRules(game.i18n.lang);
		const localizationData = {
			name: this.name,
			hitDice: numberFormat(result.type === "long" ? result.deltas.hitDice.total : -result.deltas.hitDice.total),
			hitDiceLabel: game.i18n.localize(`BF.HitDie.Label[${pluralRules.select(result.deltas.hitDice.total)}]`).toLowerCase(),
			hitPoints: numberFormat(result.deltas.hitPoints),
			hitPointsLabel: game.i18n.localize(`BF.HitPoint.Label[${pluralRules.select(result.deltas.hitPoints)}]`)
				.toLowerCase()
		};

		const chatData = {
			user: game.user.id,
			speaker: {actor: this, alias: this.name},
			flavor: game.i18n.localize(restConfig.label),
			rolls: result.rolls,
			content: game.i18n.format(localizationString, localizationData)
		};
		ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
		return ChatMessage.create(chatData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Rolling               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a roll event and pass it on to the indicated rolling method.
	 * @param {string} type - Type of roll to perform.
	 * @param {object} [config] - Additional configuration options.
	 * @param {object} [message] - Configuration data that guides roll message creation.
	 * @param {object} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise}
	 */
	async roll(type, config, message, dialog) {
		switch (type) {
			case "ability-check":
				return this.rollAbilityCheck(config, message, dialog);
			case "ability-save":
				return this.rollAbilitySave(config, message, dialog);
			case "skill":
				return this.rollSkill(config, message, dialog);
			default:
				return log(`Unknown roll type clicked ${type}`, { level: "warn" });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration information for an ability roll.
	 *
	 * @typedef {ChallengeRollConfiguration} AbilityRollConfiguration
	 * @property {string} ability - The ability to be rolled.
	 */

	/**
	 * Roll an ability check.
	 * @param {AbilityRollConfiguration} [config] - Configuration information for the roll.
	 * @param {BaseMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @param {BaseDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollAbilityCheck(config={}, message={}, dialog={}) {
		const ability = this.system.abilities[config.ability];
		if ( !ability ) return;
		const rollData = this.getRollData();

		const { parts, data } = buildRoll({
			mod: ability.mod,
			prof: ability.check.proficiency.hasProficiency ? ability.check.proficiency.term : null,
			bonus: this.system.buildBonus(ability.check.modifiers.bonus, { rollData })
		}, rollData);

		const rollConfig = foundry.utils.mergeObject({
			data,
			options: {
				minimum: this.system.buildMinimum(ability.check.modifiers.minimum, { rollData })
			}
		}, config);
		rollConfig.parts = parts.concat(config.parts ?? []);

		const type = game.i18n.format("BF.Ability.Action.CheckSpecific", {
			ability: game.i18n.localize(CONFIG.BlackFlag.abilities[config.ability].labels.full)
		});
		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject({
			data: {
				title: `${flavor}: ${this.name}`,
				flavor: type,
				speaker: ChatMessage.getSpeaker({ actor: this }),
				"flags.black-flag.roll": {
					type: "ability-check",
					ability: config.ability
				}
			}
		}, message);

		const dialogConfig = foundry.utils.mergeObject({
			options: {
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
			}
		}, dialog);

		/**
		 * A hook event that fires before an ability check is rolled.
		 * @function blackFlag.preRollAbilityCheck
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the roll is being performed.
		 * @param {ChallengeRollConfiguration} config - Configuration data for the pending roll.
		 * @param {BaseMessageConfiguration} message - Configuration data for the roll's message.
		 * @param {BaseDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if ( Hooks.call("blackFlag.preRollAbilityCheck", this, rollConfig, messageConfig, dialogConfig) === false ) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, messageConfig, dialogConfig);

		/**
		 * A hook event that fires after an ability check has been rolled.
		 * @function blackFlag.rollAbilityCheck
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the roll has been performed.
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {string} ability - ID of the ability that was rolled as defined in `CONFIG.BlackFlag.abilities`.
		 */
		if ( rolls?.length ) Hooks.callAll("blackFlag.rollAbilityCheck", this, rolls, config.ability);

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll an ability saving throw.
	 * @param {AbilityRollConfiguration} [config] - Configuration information for the roll.
	 * @param {BaseMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @param {BaseDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollAbilitySave(config={}, message={}, dialog={}) {
		const ability = this.system.abilities[config.ability];
		if ( !ability ) return;
		const rollData = this.getRollData();

		const { parts, data } = buildRoll({
			mod: ability.mod,
			prof: ability.save.proficiency.hasProficiency ? ability.save.proficiency.term : null,
			bonus: this.system.buildBonus(ability.save.modifiers.bonus, { rollData })
		}, rollData);

		const rollConfig = foundry.utils.mergeObject({
			data,
			options: {
				minimum: this.system.buildMinimum(ability.save.modifiers.minimum, { rollData })
			}
		}, config);
		rollConfig.parts = parts.concat(config.parts ?? []);

		const type = game.i18n.format("BF.Ability.Action.SaveSpecificLong", {
			ability: game.i18n.localize(CONFIG.BlackFlag.abilities[config.ability].labels.full)
		});
		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject({
			data: {
				title: `${flavor}: ${this.name}`,
				flavor: type,
				speaker: ChatMessage.getSpeaker({ actor: this }),
				"flags.black-flag.roll": {
					type: "ability-save",
					ability: config.ability
				}
			}
		}, message);

		const dialogConfig = foundry.utils.mergeObject({
			options: {
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
			}
		}, dialog);

		/**
		 * A hook event that fires before an save check is rolled.
		 * @function blackFlag.preRollAbilitySave
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the roll is being performed.
		 * @param {ChallengeRollConfiguration} config - Configuration data for the pending roll.
		 * @param {BaseMessageConfiguration} message - Configuration data for the roll's message.
		 * @param {BaseDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if ( Hooks.call("blackFlag.preRollAbilitySave", this, rollConfig, messageConfig, dialogConfig) === false ) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, messageConfig, dialogConfig);

		/**
		 * A hook event that fires after an ability save has been rolled.
		 * @function blackFlag.rollAbilitySave
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the roll has been performed.
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {string} ability - ID of the ability that was rolled as defined in `CONFIG.BlackFlag.abilities`.
		 */
		if ( rolls?.length ) Hooks.callAll("blackFlag.rollAbilitySave", this, rolls, config.ability);

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration information for a skill roll.
	 *
	 * @typedef {ChallengeRollConfiguration} SkillRollConfiguration
	 * @property {string} skill - The skill to roll.
	 * @property {string} [ability] - The ability to be rolled with the skill.
	 */

	/**
	 * Roll a skill check.
	 * @param {SkillRollConfiguration} [config] - Configuration information for the roll.
	 * @param {BaseMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @param {BaseDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollSkill(config={}, message={}, dialog={}) {
		const skill = this.system.proficiencies.skills[config.skill];
		if ( !skill ) return;
		const rollData = this.getRollData();

		const prepareSkillConfig = (baseConfig={}, formData={}) => {
			const abilityId = formData.ability ?? baseConfig.ability ?? skill.ability;
			const ability = this.system.abilities[abilityId];

			const modifierData = [
				{ type: "ability-check", ability: abilityId },
				{ type: "skill-check", ability: abilityId, skill: config.skill }
			];

			const { parts, data } = buildRoll({
				mod: ability?.mod,
				prof: skill.proficiency.hasProficiency ? skill.proficiency.proficiency.term : null,
				bonus: this.system.buildBonus(this.system.getModifiers(modifierData), { rollData })
			}, rollData);
			data.abilityId = abilityId;

			const rollConfig = foundry.utils.mergeObject(baseConfig, {
				data,
				options: {
					minimum: this.system.buildMinimum(this.system.getModifiers(modifierData, "min"), { rollData })
				}
			}, { inplace: false });
			rollConfig.parts = parts.concat(config.parts ?? []);

			return rollConfig;
		};

		const rollConfig = prepareSkillConfig(config);

		const type = game.i18n.format("BF.Skill.Action.CheckSpecific", {
			skill: game.i18n.localize(CONFIG.BlackFlag.skills[config.skill].label)
		});
		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject({
			data: {
				title: `${flavor}: ${this.name}`,
				flavor: type,
				speaker: ChatMessage.getSpeaker({ actor: this }),
				"flags.black-flag.roll": {
					type: "skill",
					skill: config.skill
				}
			}
		}, message);

		const dialogConfig = foundry.utils.mergeObject({
			buildConfig: prepareSkillConfig,
			options: {
				chooseAbility: true,
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
			}
		}, dialog);

		/**
		 * A hook event that fires before a skill check is rolled.
		 * @function blackFlag.preRollSkill
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the roll is being performed.
		 * @param {ChallengeRollConfiguration} config - Configuration data for the pending roll.
		 * @param {BaseMessageConfiguration} message - Configuration data for the roll's message.
		 * @param {BaseDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if ( Hooks.call("blackFlag.preRollSkill", this, rollConfig, messageConfig, dialogConfig) === false ) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, messageConfig, dialogConfig);

		/**
		 * A hook event that fires after a skill check has been rolled.
		 * @function blackFlag.rollSkill
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the roll has been performed.
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {string} skill - ID of the skill that was rolled as defined in `CONFIG.BlackFlag.skills`.
		 */
		if ( rolls?.length ) Hooks.callAll("blackFlag.rollSkill", this, rolls, config.skill);

		return rolls;
	}
}
