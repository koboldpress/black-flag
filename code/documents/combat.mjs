/**
 * Extended version of Combat with support for uses recovery.
 */
export default class BlackFlagCombat extends Combat {

	async startCombat() {
		await super.startCombat();
		this._recoverUses({encounter: true});
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async nextTurn() {
		await super.nextTurn();
		this._recoverUses({round: this.combatant, turn: true});
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reset combat specific uses for certain combatants.
	 * @param {object} types - Which types of recovery to handle, and whether they should be
	 *                         performed on all combatants or only the combatant specified.
	 * @param {boolean|BlackFlagCombatant} [types.encounter=false]
	 * @param {boolean|BlackFlagCombatant} [types.round=false]
	 * @param {boolean|BlackFlagCombatant} [types.turn=false]
	 */
	async _recoverUses({encounter=false, round=false, turn=false}) {
		for ( const combatant of this.combatants ) {
			const periods = [];
			if ( (encounter === true) || (encounter === combatant) ) periods.push("encounter");
			if ( (round === true) || (round === combatant) ) periods.push("round");
			if ( (turn === true) || (turn === combatant) ) periods.push("turn");
			if ( periods.length ) await combatant.recoverCombatUses(periods);
		}
	}
}
