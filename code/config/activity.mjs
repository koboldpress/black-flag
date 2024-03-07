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
	},
	healing: {
		documentClass: documents.HealingActivity,
		sheetClasses: {
			config: applications.HealingConfig
		}
	},
	savingThrow: {
		documentClass: documents.SavingThrowActivity,
		sheetClasses: {
			config: applications.SavingThrowConfig
		}
	},
	utility: {
		documentClass: documents.UtilityActivity
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Different classifications of attack types.
 * @enum {string}
 */
export const attackTypes = {
	weapon: "BF.Weapon.Label[one]",
	spell: "BF.Item.Type.Spell[one]"
};
