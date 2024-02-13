import log from "../../../utils/logging.mjs";
import { AdvancementField } from "../../fields/_module.mjs";

/**
 * Data definition template for items with advancement.
 */
export default class AdvancementTemplate extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			advancement: new AdvancementField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_onCreateApplyAdvancement(data, options, userId) {
		const progression = this.parent.actor?.system.progression;
		if ( (game.user.id !== userId) || !progression || !this.advancement.size ) return;

		// Apply all advancements for this item up to current level
		const levels = [{ character: 0, class: 0 }, ...Object.values(progression.levels).map(l => l.levels)];
		log(`Applying advancement for ${this.parent.name}`);
		for ( const level of levels ) {
			for ( const advancement of this.parent.advancementForLevel(level) ) {
				this.parent.actor.enqueueAdvancementChange(advancement, "apply", [
					level, undefined, { initial: true, render: false }
				]);
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_onDeleteRevertAdvancement(options, userId) {
		const progression = this.parent.actor?.system.progression;
		if ( (game.user.id !== userId) || !progression || !this.advancement.size ) return;

		const levels = [{ character: 0, class: 0 }, ...Object.values(progression.levels).map(l => l.levels)];
		log(`Removing advancement for ${this.parent.name}`);
		for ( const level of levels.reverse() ) {
			// TODO: These advancements should be unapplied in reverse order
			for ( const advancement of this.parent.advancementForLevel(level) ) {
				this.parent.actor.enqueueAdvancementChange(advancement, "reverse", [level, undefined, { render: false }]);
			}
		}

		// Remove any remaining advancement data
		this.parent.actor.enqueueAdvancementChange(this.parent.actor, "update", [
			{ [`system.progression.advancement.-=${this.parent.id}`]: null }, { render: false }
		]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contribute to knowable spells on the actor if has spellcasting.
	 */
	prepareFinalStats() {
		const spellcasting = this.advancement.byType("spellcasting")[0];
		const stats = this.parent.actor?.system.spellcasting?.spells?.knowable;
		if ( !spellcasting || !stats ) return;
		stats.cantrips += spellcasting.configuration.cantrips.known;
		stats.rituals += spellcasting.configuration.rituals.known;
		stats.spells += spellcasting.configuration.spells.known;
	}
}
