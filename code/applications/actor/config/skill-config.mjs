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
			template: "systems/black-flag/templates/actor/config/skill-config.hbs"
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
		let checkModifiers;
		let passiveModifiers;
		let global;
		if ( this.skillId ) {
			checkModifiers = this.getModifiers([{k: "type", v: "skill-check"}, {k: "skill", v: this.skillId}]);
			passiveModifiers = this.getModifiers([{k: "type", v: "skill-passive"}, {k: "skill", v: this.skillId}]);
			global = false;
		} else {
			const filter = modifier => !modifier.filter.some(f => f.k === "skill");
			checkModifiers = this.getModifiers([{k: "type", v: "skill-check"}], [], filter);
			passiveModifiers = this.getModifiers([{k: "type", v: "skill-passive"}], [], filter);
			global = true;
		}
		return [
			{
				category: "check", type: "bonus", label: "BF.Check.Label[one]", global, showProficiency: global,
				modifiers: checkModifiers.filter(m => m.type === "bonus")
			},
			{
				category: "passive", type: "bonus", label: "BF.Skill.Passive.LabelGeneric", global, showProficiency: global,
				modifiers: passiveModifiers
			},
			{
				category: "check", type: "min", label: "BF.Check.Label[one]", global, showProficiency: global,
				modifiers: checkModifiers.filter(m => m.type === "min")
			},
			{
				category: "check", type: "note", label: "BF.Check.Label[one]", global,
				modifiers: checkModifiers.filter(m => m.type === "note")
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
