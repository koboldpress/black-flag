import * as applications from "../applications/activity/_module.mjs";
import * as documents from "../documents/activity/_module.mjs";
import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for activity types.
 *
 * @typedef {object} ActivityTypeConfig
 * @property {boolean} [configurable] - Allow this activity type to be configured through the UI.
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
	enchant: {
		documentClass: documents.EnchantActivity,
		sheetClasses: {
			config: applications.EnchantSheet
		}
	},
	forward: {
		documentClass: documents.ForwardActivity,
		sheetClasses: {
			config: applications.ForwardSheet
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
	teleport: {
		documentClass: documents.TeleportActivity,
		sheetClasses: {
			config: applications.TeleportSheet
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
	weapon: "BF.WEAPON.Label[one]",
	spell: "BF.Item.Type.Spell[one]"
};
localizeConfig(attackTypes);
