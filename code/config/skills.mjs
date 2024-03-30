import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for skills.
 *
 * @typedef {LabeledConfiguration} SkillConfiguration
 * @property {string} abbreviation - Shortened version of the skill used for conversion from dnd5e & other features.
 * @property {string} ability - Key for the default ability used by this skill.
 */

/**
 * The set of Skills used within the system.
 * @enum {SkillConfiguration}
 */
export const skills = {
	acrobatics: {
		abbreviation: "acr",
		ability: "dexterity",
		label: "BF.Skill.Acrobatics.Label"
	},
	animalHandling: {
		abbreviation: "ani",
		ability: "wisdom",
		label: "BF.Skill.AnimalHandling.Label"
	},
	arcana: {
		abbreviation: "arc",
		ability: "intelligence",
		label: "BF.Skill.Arcana.Label"
	},
	athletics: {
		abbreviation: "ath",
		ability: "strength",
		label: "BF.Skill.Athletics.Label"
	},
	deception: {
		abbreviation: "dec",
		ability: "charisma",
		label: "BF.Skill.Deception.Label"
	},
	history: {
		abbreviation: "his",
		ability: "intelligence",
		label: "BF.Skill.History.Label"
	},
	insight: {
		abbreviation: "ins",
		ability: "wisdom",
		label: "BF.Skill.Insight.Label"
	},
	intimidation: {
		abbreviation: "itm",
		ability: "charisma",
		label: "BF.Skill.Intimidation.Label"
	},
	investigation: {
		abbreviation: "inv",
		ability: "intelligence",
		label: "BF.Skill.Investigation.Label"
	},
	medicine: {
		abbreviation: "med",
		ability: "wisdom",
		label: "BF.Skill.Medicine.Label"
	},
	nature: {
		abbreviation: "nat",
		ability: "intelligence",
		label: "BF.Skill.Nature.Label"
	},
	perception: {
		abbreviation: "prc",
		ability: "wisdom",
		label: "BF.Skill.Perception.Label"
	},
	performance: {
		abbreviation: "prf",
		ability: "charisma",
		label: "BF.Skill.Performance.Label"
	},
	persuasion: {
		abbreviation: "per",
		ability: "charisma",
		label: "BF.Skill.Persuasion.Label"
	},
	religion: {
		abbreviation: "rel",
		ability: "intelligence",
		label: "BF.Skill.Religion.Label"
	},
	sleightOfHand: {
		abbreviation: "slt",
		ability: "dexterity",
		label: "BF.Skill.SleightOfHand.Label"
	},
	stealth: {
		abbreviation: "ste",
		ability: "dexterity",
		label: "BF.Skill.Stealth.Label"
	},
	survival: {
		abbreviation: "sur",
		ability: "wisdom",
		label: "BF.Skill.Survival.Label"
	}
};
localizeConfig(skills);
