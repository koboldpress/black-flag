import * as activity from "../documents/activity/_module.mjs";

/**
 * Configuration data for activity types.
 *
 * @typedef {object} ActivityTypeConfig
 * @property {typeof Activity} documentClass -  for system data.
 */

/**
 * Activity types that can be added to items.
 * @enum {ActivityTypeConfig}
 */
export const _activityTypes = {
	attack: {
		documentClass: activity.AttackActivity
	}
};
