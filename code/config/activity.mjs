import * as applications from "../applications/activity/_module.mjs";
import * as documents from "../documents/activity/_module.mjs";

/**
 * Configuration data for activity types.
 *
 * @typedef {object} ActivityTypeConfig
 * @property {typeof Activity} documentClass - Main document class that defines activity's behavior.
 * @property {object} sheetClasses
 * @property {typeof ActivitySheet} sheetClasses.config - Configuration sheet.
 */

/**
 * Activity types that can be added to items.
 * @enum {ActivityTypeConfig}
 */
export const _activityTypes = {
	base: {
		documentClass: documents.Activity,
		sheetClasses: {
			config: applications.ActivitySheet
		}
	},
	attack: {
		documentClass: documents.AttackActivity,
		sheetClasses: {
			config: applications.AttackSheet
		}
	},
	cast: {
		documentClass: documents.CastActivity,
		sheetClasses: {
			config: applications.CastSheet
		}
	},
	check: {
		documentClass: documents.CheckActivity,
		sheetClasses: {
			config: applications.CheckSheet
		}
	},
	damage: {
		documentClass: documents.DamageActivity,
		sheetClasses: {
			config: applications.DamageSheet
		}
	},
	heal: {
		documentClass: documents.HealActivity,
		sheetClasses: {
			config: applications.HealSheet
		}
	},
	save: {
		documentClass: documents.SaveActivity,
		sheetClasses: {
			config: applications.SaveSheet
		}
	},
	summon: {
		documentClass: documents.SummonActivity,
		sheetClasses: {
			config: applications.SummonSheet
		}
	},
	utility: {
		documentClass: documents.UtilityActivity,
		sheetClasses: {
			config: applications.UtilitySheet
		}
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
