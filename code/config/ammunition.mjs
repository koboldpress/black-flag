import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of ammunition offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const ammunition = {
	arrow: {
		localization: "BF.AMMUNITION.Type.Arrow"
	},
	blowgunNeedle: {
		localization: "BF.AMMUNITION.Type.BlowgunNeedle"
	},
	crossbowBolt: {
		localization: "BF.AMMUNITION.Type.CrossbowBolt"
	},
	slingBullet: {
		localization: "BF.AMMUNITION.Type.SlingBullet"
	}
};
localizeConfig(ammunition);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to ammunition.
 * @type {string[]}
 */
export const ammunitionProperties = ["magical"];
