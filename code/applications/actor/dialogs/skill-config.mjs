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
		const checkLabel = game.i18n.format("BF.Bonus.LabelSpecific", {
			type: game.i18n.localize("BF.Check.Label[one]"), bonus: game.i18n.localize("BF.Bonus.Label[other]")
		});
		const addType = game.i18n.localize("BF.Bonus.Label[one]");
		if ( this.skillId ) {
			const skill = this.document.system.proficiencies.skills[this.skillId];
			const filter = modifier => modifier.filter.some(f => f.k === "skill" && f.v === this.skillId);
			return {
				check: {
					label: checkLabel, addType,
					modifiers: skill?.modifiers.filter(filter) ?? []
				}
			};
		}
		const filter = modifier => !modifier.filter.some(f => f.k === "skill");
		return {
			check: {
				label: game.i18n.format("BF.Bonus.LabelGlobal", { type: checkLabel }), addType,
				modifiers: this.document.system.getModifiers({ type: "skill" }).filter(filter)
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
		const data = { type: "bonus", formula: "", filter: [{ k: "type", v: "skill" }] };
		if ( this.skillId ) data.filter.push({ k: "skill", v: this.skillId });
		return data;
	}
}
