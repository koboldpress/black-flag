import BaseConfig from "./base-config.mjs";

/**
 * Dialog for configuring an individual skill.
 * @param {string} skillId - The skill being modified by this app.
 * @param {BlackFlagActor} actor - The actor to whom the skill belongs.
 * @param {object} options - Additional application rendering options.
 */
export default class SkillConfig extends BaseConfig {
	constructor(skillId, actor, options) {
		super(actor, options);
		this.skillId = skillId ?? null;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "skill"],
			template: "systems/black-flag/templates/actor/dialogs/skill-config.hbs",
			width: 400,
			height: "auto"
		});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Properties                               */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * The ability being modified by this app.
	 * @type {string|null}
	 */
	skillId;

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get type() {
		return game.i18n.localize(CONFIG.BlackFlag.abilities[this.abilityId]?.label ?? "BF.Skill.Label[one]");
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Context Preparation                      */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	async getData(options) {
		const context = await super.getData(options);
		context.skillId = this.skillId;
		context.skill = this.skillId ? context.source.proficiencies.skills[this.skillId]
			?? this.document.system.proficiencies.skills[this.skillId] ?? {} : null;
		context.proficiencyLevels = {
			0: game.i18n.localize("BF.Proficiency.Level.None"),
			0.5: game.i18n.localize("BF.Proficiency.Level.Half"),
			1: game.i18n.localize("BF.Proficiency.Level.Proficient"),
			2: game.i18n.localize("BF.Proficiency.Level.Expertise")
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareModifiers() {
		const checkBonusLabel = game.i18n.format("BF.Bonus.LabelSpecific", {
			type: game.i18n.localize("BF.Check.Label[one]"), bonus: game.i18n.localize("BF.Bonus.Label[other]")
		});
		const passiveBonusLabel = game.i18n.format("BF.Bonus.LabelSpecific", {
			type: game.i18n.localize("BF.Skill.Passive.LabelGeneric"), bonus: game.i18n.localize("BF.Bonus.Label[other]")
		});
		const checkMinLabel = game.i18n.format("BF.Roll.Minimum.LabelSpecific", {
			type: game.i18n.localize("BF.Check.Label[one]")
		});
		const addBonus = game.i18n.localize("BF.Bonus.Label[one]");
		const addMin = game.i18n.localize("BF.Roll.Minimum.Label[one]");
		if ( this.skillId ) {
			const skill = this.document.system.proficiencies.skills[this.skillId];
			const filter = modifier => modifier.filter.some(f => f.k === "skill" && f.v === this.skillId);
			return {
				"check-bonus": {
					label: checkBonusLabel, addType: addBonus,
					modifiers: skill.modifiers.check.filter(filter)
				},
				"passive-bonus": {
					label: passiveBonusLabel, addType: addBonus,
					modifiers: skill.modifiers.passive.filter(filter)
				},
				"check-min": {
					label: checkMinLabel, addType: addMin,
					modifiers: skill.modifiers.minimum.filter(filter)
				}
			};
		}
		const filter = modifier => !modifier.filter.some(f => f.k === "skill");
		return {
			"check-bonus": {
				label: game.i18n.format("BF.Bonus.LabelGlobal", { type: checkBonusLabel }), addType: addBonus,
				modifiers: this.document.system.getModifiers({ type: "skill-check" }).filter(filter)
			},
			"passive-bonus": {
				label: game.i18n.format("BF.Bonus.LabelGlobal", { type: passiveBonusLabel }), addType: addBonus,
				modifiers: this.document.system.getModifiers({ type: "skill-passive" }).filter(filter)
			},
			"check-min": {
				label: game.i18n.format("BF.Bonus.LabelGlobal", { type: checkMinLabel }), addType: addMin,
				modifiers: this.document.system.getModifiers({ type: "skill-check" }, "min").filter(filter)
			}
		};
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Action Handlers                          */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	_onChangeInput(event) {
		super._onChangeInput(event);
		if ( event.target.name === "skillId" ) {
			this.skillId = event.target.value;
			this.render();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_getModifierData(section) {
		const [sec, type] = section.split("-");
		const data = { type: type, formula: "", filter: [{ k: "type", v: `skill-${sec}` }] };
		if ( this.skillId ) data.filter.push({ k: "skill", v: this.skillId });
		console.log(data);
		return data;
	}
}
