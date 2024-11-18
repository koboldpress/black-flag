import { localizeConfig } from "../utils/_module.mjs";

/**
 * Should damages be displayed pre-aggregated in the chat?
 * @type {boolean}
 */
export const aggregateDamageDisplay = true;

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Different ways damage can be scaled.
 * @enum {LabeledConfiguration}
 */
export const damageScalingModes = {
	whole: {
		label: "BF.DAMAGE.Scaling.Mode.Whole"
	},
	half: {
		label: "BF.DAMAGE.Scaling.Mode.Half"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for damage types.
 *
 * @typedef {LabeledConfiguration} DamageTypeConfiguration
 * @property {string} icon - Icon representing the damage.
 * @property {number} [color] - Color of the damage.
 * @property {string} [reference] - UUID of a journal entry with details on this damage type.
 */

/**
 * Types of damage.
 * @enum {DamageTypeConfiguration}
 */
export const damageTypes = {
	acid: {
		label: "BF.DAMAGE.Type.Acid",
		icon: "systems/black-flag/artwork/damage/acid.svg",
		color: new Color(0x839d50),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Dx45LLPVeFTPMNJ7"
	},
	bludgeoning: {
		label: "BF.DAMAGE.Type.Bludgeoning",
		icon: "systems/black-flag/artwork/damage/bludgeoning.svg",
		color: new Color(0x0000a0),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.qWxvYtMSJMq7b8cu"
	},
	cold: {
		label: "BF.DAMAGE.Type.Cold",
		icon: "systems/black-flag/artwork/damage/cold.svg",
		color: new Color(0xadd8e6),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.33LfnLQMKLJSqEbW"
	},
	fire: {
		label: "BF.DAMAGE.Type.Fire",
		icon: "systems/black-flag/artwork/damage/fire.svg",
		color: new Color(0xff4500),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Pfk4JeLjQ5DSUwUT"
	},
	force: {
		label: "BF.DAMAGE.Type.Force",
		icon: "systems/black-flag/artwork/damage/force.svg",
		color: new Color(0x800080),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ivc2H8JjzInzqaEg"
	},
	lightning: {
		label: "BF.DAMAGE.Type.Lightning",
		icon: "systems/black-flag/artwork/damage/lightning.svg",
		color: new Color(0x1e90ff),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.BTKLWHDe2zxupshb"
	},
	necrotic: {
		label: "BF.DAMAGE.Type.Necrotic",
		icon: "systems/black-flag/artwork/damage/necrotic.svg",
		color: new Color(0x006400),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.rh7AKdxbCNie6OMl"
	},
	piercing: {
		label: "BF.DAMAGE.Type.Piercing",
		icon: "systems/black-flag/artwork/damage/piercing.svg",
		color: new Color(0xc0c0c0),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.oDlJ4GI6QmUBaxJf"
	},
	poison: {
		label: "BF.DAMAGE.Type.Poison",
		icon: "systems/black-flag/artwork/damage/poison.svg",
		color: new Color(0x8a2be2),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.3m1zwxVlklmFD7Kk"
	},
	psychic: {
		label: "BF.DAMAGE.Type.Psychic",
		icon: "systems/black-flag/artwork/damage/psychic.svg",
		color: new Color(0xff1493),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.K7dMLfqqUJxq0PJC"
	},
	radiant: {
		label: "BF.DAMAGE.Type.Radiant",
		icon: "systems/black-flag/artwork/damage/radiant.svg",
		color: new Color(0xffd700),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.RYlrlgpcQKAYDWqe"
	},
	slashing: {
		label: "BF.DAMAGE.Type.Slashing",
		icon: "systems/black-flag/artwork/damage/slashing.svg",
		color: new Color(0x8b0000),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.2MbmC9y8UL6gxqZ3"
	},
	thunder: {
		label: "BF.DAMAGE.Type.Thunder",
		icon: "systems/black-flag/artwork/damage/thunder.svg",
		color: new Color(0x708090),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.sfwK0rXw9GTREeDb"
	}
};
localizeConfig(damageTypes);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Types of healing.
 * @enum {DamageTypeConfiguration}
 */
export const healingTypes = {
	healing: {
		label: "BF.Healing.Type.Normal",
		icon: "systems/black-flag/artwork/healing/normal.svg",
		color: new Color(0x46c252)
	},
	temp: {
		label: "BF.Healing.Type.Temp",
		icon: "systems/black-flag/artwork/healing/temp.svg",
		color: new Color(0x4b66de),
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.PGW1FFQySj1EF5SV"
	},
	max: {
		label: "BF.Healing.Type.Maximum",
		icon: "systems/black-flag/artwork/healing/max.svg"
	}
};
localizeConfig(healingTypes, { sort: false });
