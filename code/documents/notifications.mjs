/**
 * Data structure to represent a document notification.
 *
 * @typedef {object} NotificationData
 * @property {string} key - Unique key for this notification.
 * @property {string} [category] - Type of data to which this notification applies (e.g. abilities, lineage).
 * @property {string} [section] - Sheet section that should display a notice about this
 *                                notification (e.g. progression, inventory).
 * @property {string} level - Level of notification severity (e.g. info, warn, error).
 * @property {number} [order] - Order in which the player should handle this notification.
 */

/**
 * Custom collection for storing messages, warnings, or errors during document preparation.
 */
export default class NotificationsCollection extends Collection {
	set(key, value) {
		value.key = key;
		super.set(key, value);
	}
}
