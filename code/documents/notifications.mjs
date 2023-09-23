/**
 * Custom collection for storing messages, warnings, or errors during document preparation.
 */
export default class NotificationsCollection extends Collection {
	set(key, value) {
		value.key = key;
		super.set(key, value);
	}
}
