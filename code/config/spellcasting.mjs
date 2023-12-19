import { numberFormat } from "../utils/_module.mjs";

/**
 * Highest ring of spellcasting.
 * @type {number}
 */
export const maxSpellRing = 9;

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for different types of spellcasting supported.
 *
 * @typedef {LabeledConfiguration} SpellcastingTypeConfiguration
 * @property {string} [trait] - How this progression will be displayed in a trait list, if no progression trait set.
 * @property {{[key: string]: SpellcastingProgressionConfiguration}} [progression] - Progression modes for this type.
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
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Types of circles to which a spell can belong.
 * @enum {LabeledConfiguration}
 */
export const spellCircles = {
	arcane: {
		label: "BF.Spell.Circle.Arcane.Label"
	},
	divine: {
		label: "BF.Spell.Circle.Divine.Label"
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
		abbreviation: "BF.Spell.Component.Verbal.Abbreviation"
	},
	somatic: {
		label: "BF.Spell.Component.Somatic.Label",
		abbreviation: "BF.Spell.Component.Somatic.Abbreviation"
	},
	material: {
		label: "BF.Spell.Component.Material.Label",
		abbreviation: "BF.Spell.Component.Material.Abbreviation"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Spell preparation methods.
 */
export const spellPreparationModes = {
	standard: {
		label: "BF.Spell.Preparation.Mode.Standard"
	},
	alwaysPrepared: {
		label: "BF.Spell.Preparation.Mode.AlwaysPrepared"
	},
	atWill: {
		label: "BF.Spell.Preparation.Mode.AtWill"
	},
	ritual: {
		label: "BF.Spell.Preparation.Mode.Ritual"
	},
	innate: {
		label: "BF.Spell.Preparation.Mode.Innate"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Number of spell slots per-ring for each spellcasting level. First set of indices correspond to spellcaster level
 * and the second correspond to rings.
 * @type {number[][]}
 */
export const spellSlotTable = [
	[],
	[, 2],       // Level 1
	[, 3],       // Level 2
	[, 4, 2],    // Level 3
	[, 4, 3],    // Level 4
	[, 4, 3, 2]  // Level 5
];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * List of spell rings with localized names.
 * @param {boolean} [plural=false] - Return the plural names where relevant.
 * @returns {[key: number]: string]}
 */
export function spellRings(plural=false) {
	return Array.fromRange(maxSpellRing + 1).reduce((obj, l) => {
		if ( l === 0 ) obj[l] = game.i18n.localize(`BF.Spell.Ring.Cantrip[${plural ? "other" : "one"}]`);
		else obj[l] = game.i18n.format("BF.Spell.Ring.Level", {
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
		label: "BF.Spell.School.Abjuration.Label"
	},
	conjuration: {
		label: "BF.Spell.School.Conjuration.Label"
	},
	divination: {
		label: "BF.Spell.School.Divination.Label"
	},
	enchantment: {
		label: "BF.Spell.School.Enchantment.Label"
	},
	evocation: {
		label: "BF.Spell.School.Evocation.Label"
	},
	illusion: {
		label: "BF.Spell.School.Illusion.Label"
	},
	necromancy: {
		label: "BF.Spell.School.Necromancy.Label"
	},
	transmutation: {
		label: "BF.Spell.School.Transmutation.Label"
	}
};

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
