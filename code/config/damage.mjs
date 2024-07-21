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
		label: "BF.Damage.Scaling.Mode.Whole"
	},
	half: {
		label: "BF.Damage.Scaling.Mode.Half"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for damage types.
 *
 * @typedef {LabeledConfiguration} DamageTypeConfiguration
 * @property {string} icon - Icon representing the damage.
 * @property {number} [color] - Color of the damage.
 */

/**
 * Types of damage.
 * @enum {DamageTypeConfiguration}
 */
export const damageTypes = {
	acid: {
		label: "BF.Damage.Type.Acid",
		icon: "systems/black-flag/artwork/damage/acid.svg",
		color: new Color(0x839d50)
	},
	bludgeoning: {
		label: "BF.Damage.Type.Bludgeoning",
		icon: "systems/black-flag/artwork/damage/bludgeoning.svg",
		color: new Color(0x0000a0)
	},
	cold: {
		label: "BF.Damage.Type.Cold",
		icon: "systems/black-flag/artwork/damage/cold.svg",
		color: new Color(0xadd8e6)
	},
	fire: {
		label: "BF.Damage.Type.Fire",
		icon: "systems/black-flag/artwork/damage/fire.svg",
		color: new Color(0xff4500)
	},
	force: {
		label: "BF.Damage.Type.Force",
		icon: "systems/black-flag/artwork/damage/force.svg",
		color: new Color(0x800080)
	},
	lightning: {
		label: "BF.Damage.Type.Lightning",
		icon: "systems/black-flag/artwork/damage/lightning.svg",
		color: new Color(0x1e90ff)
	},
	necrotic: {
		label: "BF.Damage.Type.Necrotic",
		icon: "systems/black-flag/artwork/damage/necrotic.svg",
		color: new Color(0x006400)
	},
	piercing: {
		label: "BF.Damage.Type.Piercing",
		icon: "systems/black-flag/artwork/damage/piercing.svg",
		color: new Color(0xc0c0c0)
	},
	poison: {
		label: "BF.Damage.Type.Poison",
		icon: "systems/black-flag/artwork/damage/poison.svg",
		color: new Color(0x8a2be2)
	},
	psychic: {
		label: "BF.Damage.Type.Psychic",
		icon: "systems/black-flag/artwork/damage/psychic.svg",
		color: new Color(0xff1493)
	},
	radiant: {
		label: "BF.Damage.Type.Radiant",
		icon: "systems/black-flag/artwork/damage/radiant.svg",
		color: new Color(0xffd700)
	},
	slashing: {
		label: "BF.Damage.Type.Slashing",
		icon: "systems/black-flag/artwork/damage/slashing.svg",
		color: new Color(0x8b0000)
	},
	thunder: {
		label: "BF.Damage.Type.Thunder",
		icon: "systems/black-flag/artwork/damage/thunder.svg",
		color: new Color(0x708090)
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
		color: new Color(0x4b66de)
	},
	max: {
		label: "BF.Healing.Type.Maximum"
	}
};
localizeConfig(healingTypes, { sort: false });
