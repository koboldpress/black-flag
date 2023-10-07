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
			template: "systems/black-flag/templates/actor/config/skill-config.hbs",
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
		if ( this.skillId ) {
			const skill = this.document.system.proficiencies.skills[this.skillId];
			const filter = modifier => modifier.filter.some(f => f.k === "skill" && f.v === this.skillId);
			return [
				{
					category: "check", type: "bonus", label: "BF.Check.Label[one]",
					modifiers: skill.modifiers.check.filter(filter)
				},
				{
					category: "passive", type: "bonus", label: "BF.Skill.Passive.LabelGeneric",
					modifiers: skill.modifiers.passive.filter(filter)
				},
				{
					category: "check", type: "min", label: "BF.Check.Label[one]",
					modifiers: skill.modifiers.minimum.filter(filter)
				},
				{
					category: "check", type: "note", label: "BF.Check.Label[one]",
					modifiers: skill.modifiers.notes.filter(filter)
				}
			];
		}
		const filter = modifier => !modifier.filter.some(f => f.k === "skill");
		return [
			{
				category: "check", type: "bonus", label: "BF.Check.Label[one]", global: true,
				modifiers: this.document.system.getModifiers({ type: "skill-check" }).filter(filter)
			},
			{
				category: "passive", type: "bonus", label: "BF.Skill.Passive.LabelGeneric", global: true,
				modifiers: this.document.system.getModifiers({ type: "skill-passive" }).filter(filter)
			},
			{
				category: "check", type: "min", label: "BF.Check.Label[one]", global: true,
				modifiers: this.document.system.getModifiers({ type: "skill-check" }, "min").filter(filter)
			},
			{
				category: "check", type: "note", label: "BF.Check.Label[one]", global: true,
				modifiers: this.document.system.getModifiers({ type: "skill-check" }, "note").filter(filter)
			}
		];
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

	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: `skill-${category}` }] };
		if ( this.skillId ) data.filter.push({ k: "skill", v: this.skillId });
		return data;
	}
}
