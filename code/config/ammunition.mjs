import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of ammunition offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const ammunition = {
	arrow: {
		localization: "BF.Ammunition.Type.Arrow"
	},
	blowgunNeedle: {
		localization: "BF.Ammunition.Type.BlowgunNeedle"
	},
	crossbowBolt: {
		localization: "BF.Ammunition.Type.CrossbowBolt"
	},
	slingBullet: {
		localization: "BF.Ammunition.Type.SlingBullet"
	}
};
localizeConfig(ammunition);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to ammunition.
 * @type {string[]}
 */
export const ammunitionProperties = ["magical"];
