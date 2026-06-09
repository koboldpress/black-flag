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
 * @enum {NestedLinkedConfiguration}
 */
export const armor = {
	light: {
		localization: "BF.ARMOR.Category.Light",
		children: {
			padded: {
				label: "BF.ARMOR.Type.Padded",
				link: "Compendium.black-flag.items.Item.28Zmdi4lQAr5L45X"
			},
			leather: {
				label: "BF.ARMOR.Type.Leather",
				link: "Compendium.black-flag.items.Item.h3Km60Kh2WNvWRoY"
			},
			studdedLeather: {
				label: "BF.ARMOR.Type.StuddedLeather",
				link: "Compendium.black-flag.items.Item.wltnYOTuHz96wXq5"
			},
			brigandine: {
				label: "BF.ARMOR.Type.Brigandine",
				link: "Compendium.black-flag.items.Item.Ignbkx9bqPp8hq90"
			}
		}
	},
	medium: {
		localization: "BF.ARMOR.Category.Medium",
		children: {
			hide: {
				label: "BF.ARMOR.Type.Hide",
				link: "Compendium.black-flag.items.Item.fN3bw7IZzSxbkcYX"
			},
			chainShirt: {
				label: "BF.ARMOR.Type.ChainShirt",
				link: "Compendium.black-flag.items.Item.FO53M9vYJXLrYPDs"
			},
			scaleMail: {
				label: "BF.ARMOR.Type.ScaleMail",
				link: "Compendium.black-flag.items.Item.lpKzUaG0LmkOqTb0"
			},
			breastplate: {
				label: "BF.ARMOR.Type.Breastplate",
				link: "Compendium.black-flag.items.Item.YdpLwxf7AjDtaSke"
			},
			halfPlate: {
				label: "BF.ARMOR.Type.HalfPlate",
				link: "Compendium.black-flag.items.Item.Hu7dZSxIN5djyyti"
			}
		},
		modifier: {
			max: 2
		}
	},
	heavy: {
		localization: "BF.ARMOR.Category.Heavy",
		children: {
			ringMail: {
				label: "BF.ARMOR.Type.RingMail",
				link: "Compendium.black-flag.items.Item.eu0rwXeQY3hIz8dq"
			},
			chainMail: {
				label: "BF.ARMOR.Type.ChainMail",
				link: "Compendium.black-flag.items.Item.FrdsogSzdIlz9Lmo"
			},
			splint: {
				label: "BF.ARMOR.Type.Splint",
				link: "Compendium.black-flag.items.Item.yvfflYNjyeKZNbew"
			},
			plate: {
				label: "BF.ARMOR.Type.Plate",
				link: "Compendium.black-flag.items.Item.AG4f7orze4Gsj9UO"
			}
		},
		modifier: {
			min: 0,
			max: 0
		}
	},
	shield: {
		localization: "BF.ARMOR.Category.Shield",
		link: "Compendium.black-flag.items.Item.eLqVG90tzGjKbWCp"
	}
};
localizeConfig(armor, { sort: false });
localizeConfig(armor, { flatten: true, propertyName: "allLocalized" });
localizeConfig(armor.light.children);
localizeConfig(armor.medium.children);
localizeConfig(armor.heavy.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration for armor formulas.
 *
 * @typedef {LabeledConfiguration} ArmorFormulaConfiguration
 * @property {string} formula - The formula used for calculation.
 * @property {boolean|null} armored - Whether this formula requires armor, requires no armor, or doesn't restrict.
 * @property {boolean|null} shielded - Whether this formula requires shield, requires no shield, or doesn't restrict.
 */

/**
 * Different armor formulas provided out of the box.
 * @enum {ArmorFormulaConfiguration}
 */
export const armorFormulas = {
	unarmored: {
		label: "BF.ARMORCLASS.Formula.Unarmored",
		formula: "10 + @abilities.dexterity.mod",
		armored: false,
		shielded: null
	},
	armored: {
		label: "BF.ARMORCLASS.Formula.Armored",
		formula: "@attributes.ac.armor + @attributes.ac.clamped.dexterity",
		armored: true,
		shielded: null
	},
	natural: {
		label: "BF.ARMORCLASS.Formula.Natural",
		formula: "@attributes.ac.flat",
		armored: null,
		shielded: null
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to armor.
 * @type {string[]}
 */
export const armorProperties = ["cumbersome", "magical", "naturalMaterials", "noisy"];
