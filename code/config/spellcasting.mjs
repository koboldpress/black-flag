import { localizeConfig, numberFormat } from "../utils/_module.mjs";

/**
 * Highest circle of spellcasting.
 * @type {number}
 */
export const maxSpellCircle = 9;

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for different types of spellcasting supported.
 *
 * @typedef {LabeledConfiguration} SpellcastingTypeConfiguration
 * @property {string} [trait] - How this progression will be displayed in a trait list, if no progression trait set.
 * @property {Record<string, SpellcastingProgressionConfiguration>} [progression] - Progression modes for this type.
 * @property {Set<string>|boolean} [learningModes] - What learning modes can be used with this spellcasting type?
 */

/**
 * Configuration data for a spellcasting progression mode.
 *
 * @typedef {LabeledConfiguration} SpellcastingProgressionConfiguration
 * @property {string} [trait] - How this progression will be displayed in a trait list.
 * @property {number} [divisor=1] - Value by which the class levels are divided to determine spellcasting level.
 * @property {boolean} [roundUp=false] - Should fractional values should be rounded up by default?
 */

/**
 * Different spellcasting types and their progression.
 * @type {SpellcastingTypeConfiguration}
 */
export const spellcastingTypes = {
	leveled: {
		label: "BF.Spellcasting.Type.Leveled.Label",
		trait: "BF.Spellcasting.Type.Trait",
		progression: {
			full: {
				label: "BF.Spellcasting.Progression.Full.Label",
				divisor: 1
			},
			half: {
				label: "BF.Spellcasting.Progression.Half.Label",
				trait: "BF.Spellcasting.Progression.Half.Trait",
				divisor: 2
			},
			third: {
				label: "BF.Spellcasting.Progression.Third.Label",
				trait: "BF.Spellcasting.Progression.Third.Trait",
				divisor: 3
			}
		}
	},
	pact: {
		label: "BF.Spellcasting.Type.Pact.Label",
		trait: "BF.Spellcasting.Type.Pact.Trait"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Components that can be required by spells.
 * @enum {AbbreviatedConfiguration}
 */
export const spellComponents = {
	verbal: {
		label: "BF.Spell.Component.Verbal.Label",
		abbreviation: "BF.Spell.Component.Verbal.Abbreviation",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.W1SxhcKBlrC3j8bI"
	},
	somatic: {
		label: "BF.Spell.Component.Somatic.Label",
		abbreviation: "BF.Spell.Component.Somatic.Abbreviation",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.VO8PLFNF1WHN6exu"
	},
	material: {
		label: "BF.Spell.Component.Material.Label",
		abbreviation: "BF.Spell.Component.Material.Abbreviation",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.wLWe4finRmO658xK"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for ways to learn spells.
 *
 * @typedef {LabeledConfiguration} SpellLearningModeConfiguration
 * @property {boolean} [prepared] - Does this learning mode need to learn spells?
 */

/**
 * Different ways in which a character can learn spells as they level up.
 * @type {SpellLearningModeConfiguration}
 */
export const spellLearningModes = {
	all: {
		label: "BF.Spellcasting.Learning.Mode.All.Label",
		hint: "BF.Spellcasting.Learning.Mode.All.Hint",
		prepared: true
	},
	limited: {
		label: "BF.Spellcasting.Learning.Mode.Limited.Label",
		hint: "BF.Spellcasting.Learning.Mode.Limited.Hint"
	},
	spellbook: {
		label: "BF.Spellcasting.Learning.Mode.Spellbook.Label",
		hint: "BF.Spellcasting.Learning.Mode.Spellbook.Hint",
		prepared: true
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for spell preparation modes.
 *
 * @typedef {LabeledConfiguration} SpellPreparationConfiguration
 * @property {boolean} [preparable] - Can this spell be prepared?
 * @property {boolean} [scalable] - Can spells with this mode be scaled?
 */

/**
 * Spell preparation modes.
 * @type {SpellPreparationConfiguration}
 */
export const spellPreparationModes = {
	standard: {
		label: "BF.Spell.Preparation.Mode.Standard",
		preparable: true,
		scalable: true
	},
	pact: {
		label: "BF.Spell.Preparation.Mode.Pact",
		scalable: true
	},
	atWill: {
		label: "BF.Spell.Preparation.Mode.AtWill"
	},
	innate: {
		label: "BF.Spell.Preparation.Mode.Innate"
	}
};
localizeConfig(spellPreparationModes, { sort: false });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Number of spell slots per-circle for each spellcasting level. First set of indices correspond to spellcaster level
 * and the second correspond to circles.
 * @type {number[][]}
 */
export const spellSlotTable = [
	// 1  2  3  4  5
	[],
	[, 2], // Level 1
	[, 3], // Level 2
	[, 4, 2], // Level 3
	[, 4, 3], // Level 4
	[, 4, 3, 2], // Level 5
	[, 4, 3, 3], // Level 6
	[, 4, 3, 3, 1], // Level 7
	[, 4, 3, 3, 2], // Level 8
	[, 4, 3, 3, 3, 1], // Level 9
	[, 4, 3, 3, 3, 2], // Level 10
	// 1  2  3  4  5  6  7  8  9
	[, 4, 3, 3, 3, 2, 1], // Level 11
	[, 4, 3, 3, 3, 2, 1], // Level 12
	[, 4, 3, 3, 3, 2, 1, 1], // Level 13
	[, 4, 3, 3, 3, 2, 1, 1], // Level 14
	[, 4, 3, 3, 3, 2, 1, 1, 1], // Level 15
	[, 4, 3, 3, 3, 2, 1, 1, 1], // Level 16
	[, 4, 3, 3, 3, 2, 1, 1, 1, 1], // Level 17
	[, 4, 3, 3, 3, 3, 1, 1, 1, 1], // Level 18
	[, 4, 3, 3, 3, 3, 2, 1, 1, 1], // Level 19
	[, 4, 3, 3, 3, 3, 2, 1, 1, 1] // Level 20
];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * List of spell circles with localized names.
 * @param {object} [options={}]
 * @param {boolean} [options.dashed=false] - Should there be a dash between the number and word?
 * @param {boolean} [options.plural=false] - Return the plural names where relevant.
 * @param {boolean} [options.includeCantrip=true] - Should cantrips be included with other circles?
 * @returns {[key: number]: string]}
 */
export function spellCircles({ dashed = false, plural = false, includeCantrip = true } = {}) {
	return Array.fromRange(maxSpellCircle + Number(includeCantrip), Number(!includeCantrip)).reduce((obj, l) => {
		if (l === 0) obj[l] = game.i18n.localize(`BF.Spell.Circle.Cantrip[${plural ? "other" : "one"}]`);
		else
			obj[l] = game.i18n.format(`BF.Spell.Circle.Level${dashed ? "Dashed" : ""}`, {
				number: numberFormat(l, { ordinal: true })
			});
		return obj;
	}, {});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Different schools to which a spell can belong.
 * @enum {LabeledConfiguration}
 */
export const spellSchools = {
	abjuration: {
		label: "BF.Spell.School.Abjuration.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.DcoTpX7y2OtoUFrL"
	},
	conjuration: {
		label: "BF.Spell.School.Conjuration.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.zDbDUgVoYHwwMdUd"
	},
	divination: {
		label: "BF.Spell.School.Divination.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.40jPfp8PbmjhJfgS"
	},
	enchantment: {
		label: "BF.Spell.School.Enchantment.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.XxEvnr7eyY4g7m7M"
	},
	evocation: {
		label: "BF.Spell.School.Evocation.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.kxX9JTanZWJkEzpc"
	},
	illusion: {
		label: "BF.Spell.School.Illusion.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.PaxaHveatHiNGdSY"
	},
	necromancy: {
		label: "BF.Spell.School.Necromancy.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.cWCZy1b9fvechVL1"
	},
	transmutation: {
		label: "BF.Spell.School.Transmutation.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.TQXdW6aA3LjO10Ol"
	}
};
localizeConfig(spellSchools);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Spellcasting sources to which a spell can belong.
 * @enum {LabeledConfiguration}
 */
export const spellSources = {
	arcane: {
		label: "BF.Spell.Source.Arcane.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.SM8bmpPSa9muCW30"
	},
	divine: {
		label: "BF.Spell.Source.Divine.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.sq1yhbfrrTAqw5c5"
	},
	primordial: {
		label: "BF.Spell.Source.Primordial.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Egu3TijvCVrn6NxR"
	},
	wyrd: {
		label: "BF.Spell.Source.Wyrd.Label",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.n0wni0OGVRyrenVZ"
	}
};
localizeConfig(spellSources);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Tags that can be attached to spells.
 * @enum {AbbreviatedConfiguration}
 */
export const spellTags = {
	concentration: {
		label: "BF.Spell.Tag.Concentration.Label",
		abbreviation: "BF.Spell.Tag.Concentration.Abbreviation"
	},
	ritual: {
		label: "BF.Spell.Tag.Ritual.Label",
		abbreviation: "BF.Spell.Ritual.Ritual.Abbreviation"
	}
};
