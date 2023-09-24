import { DocumentMixin } from "./mixin.mjs";
import NotificationsCollection from "./notifications.mjs";

export default class BlackFlagActor extends DocumentMixin(Actor) {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Collection of notifications that should be displayed on the actor sheet.
	 */
	notifications = this.notifications;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An object that tracks which tracks the changes to the data model which were applied by advancement.
	 * @type {object}
	 */
	advancementOverrides = this.advancementOverrides ?? {};

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
		this.applyAdvancementEffects();
		return super.applyActiveEffects();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply any transformations to the Actor which are caused by dynamic Advancement.
	 */
	applyAdvancementEffects() {
		const applier = new ActiveEffect({ name: "temp" });
		const overrides = {};

		const levels = Array.fromRange(Object.keys(this.system.progression?.levels ?? {}).length + 1);
		for ( const level of levels ) {
			const changes = [];
			for ( const advancement of this.advancementForLevel(level) ) {
				const advChanges = advancement.changes({character: level, class: level})?.map(change => {
					const c = foundry.utils.deepClone(change);
					c.advancement = advancement;
					c.priority ??= c.mode * 10;
					return c;
				});
				if ( !advChanges?.length ) continue;
				changes.push(...advChanges);
			}
			changes.sort((lhs, rhs) => lhs.priority - rhs.priority);

			for ( const change of changes ) {
				if ( !change.key ) continue;
				const theseChanges = applier.apply(this, change);
				Object.assign(overrides, theseChanges);
			}
		}

		this.advancementOverrides = foundry.utils.expandObject(overrides);
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
		// TODO: Rework to support different character/class levels
		for ( const item of this.items ) {
			for ( const advancement of item.advancementForLevel(level) ) {
				yield advancement;
			}
		}
	}
}
