import { DocumentMixin } from "./mixin.mjs";
import NotificationsCollection from "./notifications.mjs";

export default class BlackFlagActor extends DocumentMixin(Actor) {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Collection of notifications that should be displayed on the actor sheet.
	 */
	notifications;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareData() {
		this.notifications = new NotificationsCollection();
		super.prepareData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	applyActiveEffects() {
		this.system.prepareEmbeddedData?.();
		return super.applyActiveEffects();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get advancement for the actor.
	 * @param {number} level - Level for which to get the advancement.
	 * @yields {Advancement}
	 */
	*advancementForLevel(level=0) {
		for ( const item of this.items ) {
			for ( const advancement of item.advancementForLevel(level) ) {
				yield advancement;
			}
		}
	}
}
