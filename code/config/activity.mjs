import * as applications from "../applications/activity/_module.mjs";
import * as documents from "../documents/activity/_module.mjs";

/**
 * Configuration data for activity types.
 *
 * @typedef {object} ActivityTypeConfig
 * @property {typeof Activity} documentClass - Main document class that defines activity's behavior.
 * @property {object} sheetClasses
 * @property {typeof ActivityConfig} sheetClasses.config - Configuration sheet.
 */

/**
 * Activity types that can be added to items.
 * @enum {ActivityTypeConfig}
 */
export const _activityTypes = {
	base: {
		documentClass: documents.Activity,
		sheetClasses: {
			config: applications.ActivityConfig
		}
	},
	attack: {
		documentClass: documents.AttackActivity,
		sheetClasses: {
			config: applications.AttackConfig
		}
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Different classifications of attack types.
 * @enum {string}
 */
export const attackTypes = {
	spell: "BF.Item.Type.Spell[one]",
	weapon: "BF.Weapon.Label[one]"
};
