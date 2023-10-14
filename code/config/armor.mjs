import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for armor categories & base types.
 *
 * @typedef {NestedTypeConfiguration} ArmorTypeConfiguration
 * @property {object} [modifier]
 * @property {number} [modifier.min] - Minimum value of the modifier to be applied to this armor's calculation.
 * @property {number} [modifier.max] - Maximum value of the modifier to be applied to this armor's calculation.
 */

/**
 * Types of armor offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const armor = {
	light: {
		localization: "BF.Armor.Category.Light",
		children: {
			leather: {
				label: "BF.Armor.Type.Leather"
			},
			studdedLeather: {
				label: "BF.Armor.Type.StuddedLeather"
			}
		}
	},
	medium: {
		localization: "BF.Armor.Category.Medium",
		children: {
			hide: {
				label: "BF.Armor.Type.Hide"
			},
			chainShirt: {
				label: "BF.Armor.Type.ChainShirt"
			},
			scaleMail: {
				label: "BF.Armor.Type.ScaleMail"
			},
			halfPlate: {
				label: "BF.Armor.Type.HalfPlate"
			}
		},
		modifier: {
			max: 2
		}
	},
	heavy: {
		localization: "BF.Armor.Category.Heavy",
		children: {
			ringMail: {
				label: "BF.Armor.Type.RingMail"
			},
			chainMail: {
				label: "BF.Armor.Type.ChainMail"
			},
			splint: {
				label: "BF.Armor.Type.Splint"
			},
			plate: {
				label: "BF.Armor.Type.Plate"
			}
		},
		modifier: {
			min: 0,
			max: 0
		}
	},
	shield: {
		localization: "BF.Armor.Category.Shield"
	}
};
localizeConfig(armor, { sort: false });
localizeConfig(armor.light.children);
localizeConfig(armor.medium.children);
localizeConfig(armor.heavy.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to armor.
 * @enum {LabeledConfiguration}
 */
export const armorProperties = {
	cumbersome: {
		label: "BF.Armor.Property.Cumbersome.Label"
	},
	naturalMaterials: {
		label: "BF.Armor.Property.NaturalMaterials.Label"
	},
	noisy: {
		label: "BF.Armor.Property.Noisy.Label"
	}
};
