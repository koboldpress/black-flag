export default class BlackFlagActor extends Actor {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
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
			for ( const advancement of item.system.advancement?.values() ?? [] ) {
				if ( advancement.levels.includes(level) ) yield advancement;
			}
		}
	}
}
