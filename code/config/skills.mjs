import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for skills.
 *
 * @typedef {LabeledConfiguration} SkillConfiguration
 * @property {string} abbreviation - Shortened version of the skill used for conversion from dnd5e & other features.
 * @property {string} ability - Key for the default ability used by this skill.
 * @property {string} [reference] - UUID of a journal entry with details on this ability.
 */

/**
 * The set of Skills used within the system.
 * @enum {SkillConfiguration}
 */
export const skills = {
	acrobatics: {
		abbreviation: "acr",
		ability: "dexterity",
		label: "BF.Skill.Acrobatics.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.0rnx5k7zLW1jLsA3"
	},
	animalHandling: {
		abbreviation: "ani",
		ability: "wisdom",
		label: "BF.Skill.AnimalHandling.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.VCX1jEWng4DMJU7H"
	},
	arcana: {
		abbreviation: "arc",
		ability: "intelligence",
		label: "BF.Skill.Arcana.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.o5ZHVnTLZYI7rNbo"
	},
	athletics: {
		abbreviation: "ath",
		ability: "strength",
		label: "BF.Skill.Athletics.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.f4nHzzwmvXLTMtBN"
	},
	deception: {
		abbreviation: "dec",
		ability: "charisma",
		label: "BF.Skill.Deception.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.XaT2y2buV0yvDrTk"
	},
	history: {
		abbreviation: "his",
		ability: "intelligence",
		label: "BF.Skill.History.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.2aWfTWGV9hXNn852"
	},
	insight: {
		abbreviation: "ins",
		ability: "wisdom",
		label: "BF.Skill.Insight.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.MPosUcQrIt9cPpAm"
	},
	intimidation: {
		abbreviation: "itm",
		ability: "charisma",
		label: "BF.Skill.Intimidation.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.7q5pPgwleIwNsQNC"
	},
	investigation: {
		abbreviation: "inv",
		ability: "intelligence",
		label: "BF.Skill.Investigation.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.8qBuzZi49vwFhBkN"
	},
	medicine: {
		abbreviation: "med",
		ability: "wisdom",
		label: "BF.Skill.Medicine.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Y4A240Yf16dCnCVU"
	},
	nature: {
		abbreviation: "nat",
		ability: "intelligence",
		label: "BF.Skill.Nature.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.QjxD5FiLqzvOLxWu"
	},
	perception: {
		abbreviation: "prc",
		ability: "wisdom",
		label: "BF.Skill.Perception.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ZaOV2vOXwjLvA6Hu"
	},
	performance: {
		abbreviation: "prf",
		ability: "charisma",
		label: "BF.Skill.Performance.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.mmpNs1ZOLpBzesLb"
	},
	persuasion: {
		abbreviation: "per",
		ability: "charisma",
		label: "BF.Skill.Persuasion.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.yXAwGzMClEIYisik"
	},
	religion: {
		abbreviation: "rel",
		ability: "intelligence",
		label: "BF.Skill.Religion.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.nyn5Aek4FY30ucRT"
	},
	sleightOfHand: {
		abbreviation: "slt",
		ability: "dexterity",
		label: "BF.Skill.SleightOfHand.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.B3NYZiRdJrGJmQ43"
	},
	stealth: {
		abbreviation: "ste",
		ability: "dexterity",
		label: "BF.Skill.Stealth.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.P3qlI7fAxH63YDTg"
	},
	survival: {
		abbreviation: "sur",
		ability: "wisdom",
		label: "BF.Skill.Survival.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.aGBN1xZWuB48dPB9"
	}
};
localizeConfig(skills);
