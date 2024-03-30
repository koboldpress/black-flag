import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for damage types.
 *
 * @typedef {LabeledConfiguration} DamageTypeConfiguration
 */

/**
 * Types of damage.
 * @enum {DamageTypeConfiguration}
 */
export const damageTypes = {
	acid: {
		label: "BF.Damage.Type.Acid"
	},
	bludgeoning: {
		label: "BF.Damage.Type.Bludgeoning"
	},
	cold: {
		label: "BF.Damage.Type.Cold"
	},
	fire: {
		label: "BF.Damage.Type.Fire"
	},
	force: {
		label: "BF.Damage.Type.Force"
	},
	lightning: {
		label: "BF.Damage.Type.Lightning"
	},
	necrotic: {
		label: "BF.Damage.Type.Necrotic"
	},
	piercing: {
		label: "BF.Damage.Type.Piercing"
	},
	poison: {
		label: "BF.Damage.Type.Poison"
	},
	psychic: {
		label: "BF.Damage.Type.Psychic"
	},
	radiant: {
		label: "BF.Damage.Type.Radiant"
	},
	slashing: {
		label: "BF.Damage.Type.Slashing"
	},
	thunder: {
		label: "BF.Damage.Type.Thunder"
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
		label: "BF.Healing.Type.Normal"
	},
	temp: {
		label: "BF.Healing.Type.Temp"
	},
	max: {
		label: "BF.Healing.Type.Maximum"
	}
};
localizeConfig(healingTypes, { sort: false });
