/**
 * Extended version of Combat with support for uses recovery.
 */
export default class BlackFlagCombat extends Combat {
	/** @inheritDoc */
	async startCombat() {
		await super.startCombat();
		this._recoverUses({ encounter: true });
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async nextTurn() {
		const previous = this.combatant;
		await super.nextTurn();
		this._recoverUses({ roundEnd: previous, roundStart: this.combatant, turn: true });
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reset combat specific uses for certain combatants.
	 * @param {object} types - Which types of recovery to handle, and whether they should be
	 *                         performed on all combatants or only the combatant specified.
	 * @param {boolean|BlackFlagCombatant} [types.encounter=false]
	 * @param {boolean|BlackFlagCombatant} [types.roundStart=false]
	 * @param {boolean|BlackFlagCombatant} [types.roundEnd=false]
	 * @param {boolean|BlackFlagCombatant} [types.turn=false]
	 */
	async _recoverUses({ encounter = false, roundStart = false, roundEnd = false, turn = false }) {
		for (const combatant of this.combatants) {
			const periods = [];
			if (encounter === true || encounter === combatant) periods.push("encounter");
			if (roundStart === true || roundStart === combatant) periods.push("round");
			if (roundEnd === true || roundEnd === combatant) periods.push("roundEnd");
			if (turn === true || turn === combatant) periods.push("turn");
			if (periods.length) await combatant.recoverCombatUses(periods);
		}
	}
}
