import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for skills.
 *
 * @typedef {LabeledConfiguration} SkillConfiguration
 * @property {string} abbreviation - Shortened version of the skill used for conversion from dnd5e & other features.
 * @property {string} ability - Key for the default ability used by this skill.
 * @property {string} icon - Icon representing the skill.
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
		icon: "icons/equipment/feet/shoes-simple-leaf-green.webp",
		label: "BF.Skill.Acrobatics.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.0rnx5k7zLW1jLsA3"
	},
	animalHandling: {
		abbreviation: "ani",
		ability: "wisdom",
		icon: "icons/environment/creatures/horse-brown.webp",
		label: "BF.Skill.AnimalHandling.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.VCX1jEWng4DMJU7H"
	},
	arcana: {
		abbreviation: "arc",
		ability: "intelligence",
		icon: "icons/sundries/books/book-embossed-jewel-silver-green.webp",
		label: "BF.Skill.Arcana.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.o5ZHVnTLZYI7rNbo"
	},
	athletics: {
		abbreviation: "ath",
		ability: "strength",
		icon: "icons/magic/control/buff-strength-muscle-damage-orange.webp",
		label: "BF.Skill.Athletics.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.f4nHzzwmvXLTMtBN"
	},
	deception: {
		abbreviation: "dec",
		ability: "charisma",
		icon: "icons/magic/control/mouth-smile-deception-purple.webp",
		label: "BF.Skill.Deception.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.XaT2y2buV0yvDrTk"
	},
	history: {
		abbreviation: "his",
		ability: "intelligence",
		icon: "icons/sundries/books/book-embossed-bound-brown.webp",
		label: "BF.Skill.History.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.2aWfTWGV9hXNn852"
	},
	insight: {
		abbreviation: "ins",
		ability: "wisdom",
		icon: "icons/magic/perception/orb-crystal-ball-scrying-blue.webp",
		label: "BF.Skill.Insight.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.MPosUcQrIt9cPpAm"
	},
	intimidation: {
		abbreviation: "itm",
		ability: "charisma",
		icon: "icons/skills/social/intimidation-impressing.webp",
		label: "BF.Skill.Intimidation.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.7q5pPgwleIwNsQNC"
	},
	investigation: {
		abbreviation: "inv",
		ability: "intelligence",
		icon: "icons/tools/scribal/magnifying-glass.webp",
		label: "BF.Skill.Investigation.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.8qBuzZi49vwFhBkN"
	},
	medicine: {
		abbreviation: "med",
		ability: "wisdom",
		icon: "icons/tools/cooking/mortar-herbs-yellow.webp",
		label: "BF.Skill.Medicine.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Y4A240Yf16dCnCVU"
	},
	nature: {
		abbreviation: "nat",
		ability: "intelligence",
		icon: "icons/magic/nature/plant-sprout-snow-green.webp",
		label: "BF.Skill.Nature.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.QjxD5FiLqzvOLxWu"
	},
	perception: {
		abbreviation: "prc",
		ability: "wisdom",
		icon: "icons/magic/perception/eye-ringed-green.webp",
		label: "BF.Skill.Perception.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ZaOV2vOXwjLvA6Hu"
	},
	performance: {
		abbreviation: "prf",
		ability: "charisma",
		icon: "icons/tools/instruments/lute-gold-brown.webp",
		label: "BF.Skill.Performance.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.mmpNs1ZOLpBzesLb"
	},
	persuasion: {
		abbreviation: "per",
		ability: "charisma",
		icon: "icons/skills/social/diplomacy-handshake.webp",
		label: "BF.Skill.Persuasion.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.yXAwGzMClEIYisik"
	},
	religion: {
		abbreviation: "rel",
		ability: "intelligence",
		icon: "icons/magic/holy/saint-glass-portrait-halo.webp",
		label: "BF.Skill.Religion.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.nyn5Aek4FY30ucRT"
	},
	sleightOfHand: {
		abbreviation: "slt",
		ability: "dexterity",
		icon: "icons/sundries/gaming/playing-cards.webp",
		label: "BF.Skill.SleightOfHand.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.B3NYZiRdJrGJmQ43"
	},
	stealth: {
		abbreviation: "ste",
		ability: "dexterity",
		icon: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
		label: "BF.Skill.Stealth.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.P3qlI7fAxH63YDTg"
	},
	survival: {
		abbreviation: "sur",
		ability: "wisdom",
		icon: "icons/magic/fire/flame-burning-campfire-yellow-blue.webp",
		label: "BF.Skill.Survival.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.aGBN1xZWuB48dPB9"
	}
};
localizeConfig(skills);
