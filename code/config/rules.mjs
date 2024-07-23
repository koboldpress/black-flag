/**
 * Configuration information for rule types.
 *
 * @typedef {object} RuleTypeConfiguration
 * @property {string} label         Localized label for the rule type.
 * @property {string} [references]  Key path for a configuration object that contains reference data.
 */

/**
 * Types of rules that can be used in rule pages and the &Reference enricher.
 * @enum {RuleTypeConfiguration}
 */
export const ruleTypes = {
	rule: {
		label: "BF.Rule.Type.Rule",
		references: "rules"
	},
	ability: {
		label: "BF.Ability.Label[one]",
		references: "enrichment.lookup.abilities"
	},
	skill: {
		label: "BF.Skill.Label[one]",
		references: "enrichment.lookup.skills"
	},
	areaOfEffect: {
		label: "BF.AreaOfEffect.Label"
	},
	condition: {
		label: "BF.Condition.Label[one]",
		references: "conditions"
	},
	creatureTag: {
		label: "BF.CreatureType.Tag.RuleLabel",
		references: "creatureTags"
	},
	creatureType: {
		label: "BF.CreatureType.Label",
		references: "creatureTypes"
	},
	damageType: {
		label: "BF.Damage.Type.Label",
		references: "damageTypes"
	},
	healingType: {
		label: "BF.Healing.Type.Label",
		references: "healingTypes"
	},
	spellComponent: {
		label: "BF.Spell.Component.RuleLabel"
	},
	spellSchool: {
		label: "BF.Spell.School.RuleLabel"
	},
	spellSource: {
		label: "BF.Spell.Source.RuleLabel"
	},
	spellTag: {
		label: "BF.Spell.Tag.RuleLabel"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * List of rules that can be referenced from enrichers.
 * @enum {string}
 */
export const rules = {};
