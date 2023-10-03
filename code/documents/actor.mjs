import { buildRoll, log } from "../utils/_module.mjs";
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
			bonus: this.system.buildBonus(ability.check.modifiers, { rollData })
		}, rollData);

		const rollConfig = foundry.utils.mergeObject({ data }, config);
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
			bonus: this.system.buildBonus(ability.save.modifiers, { rollData })
		}, rollData);

		const rollConfig = foundry.utils.mergeObject({ data }, config);
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

			const { parts, data } = buildRoll({
				mod: ability?.mod,
				prof: skill.proficiency.hasProficiency ? skill.proficiency.proficiency.term : null,
				bonus: this.system.buildBonus(this.system.getModifiers([
					{ type: "ability-check", ability: abilityId },
					{ type: "skill", ability: abilityId, skill: config.skill }
				]), { rollData })
			}, rollData);
			data.abilityId = abilityId;

			const rollConfig = foundry.utils.mergeObject(baseConfig, { data }, { inplace: false });
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
