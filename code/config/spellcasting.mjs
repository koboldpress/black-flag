import { numberFormat } from "../utils/_module.mjs";

/**
 * Highest ring of spellcasting.
 * @type {number}
 */
export const maxSpellRing = 9;

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
