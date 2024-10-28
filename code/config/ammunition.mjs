import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of ammunition offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const ammunition = {
	arrow: {
		localization: "BF.AMMUNITION.Type.Arrow",
		link: "Compendium.black-flag.items.Item.pLXuZs8PTiEt5PmK"
	},
	blowgunNeedle: {
		localization: "BF.AMMUNITION.Type.BlowgunNeedle",
		link: "Compendium.black-flag.items.Item.2m22nW2ojmJJm0xW"
	},
	crossbowBolt: {
		localization: "BF.AMMUNITION.Type.CrossbowBolt",
		link: "Compendium.black-flag.items.Item.cUcIM6yesvDT51kY"
	},
	slingBullet: {
		localization: "BF.AMMUNITION.Type.SlingBullet",
		link: "Compendium.black-flag.items.Item.gJkNOy9ZuXqxuFYN"
	}
};
localizeConfig(ammunition);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to ammunition.
 * @type {string[]}
 */
export const ammunitionProperties = ["magical"];
