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
	async endCombat() {
		await super.endCombat();
		this._recoverUses({ turn: true, roundEnd: true, roundStart: true });
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async rollInitiative(ids, options = {}) {
		await super.rollInitiative(ids, options);
		for (const id of ids) await this._recoverUses({ initiative: this.combatants.get(id) });
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onEndTurn(combatant) {
		await super._onEndTurn(combatant);
		this._recoverUses({ roundEnd: combatant });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onStartTurn(combatant) {
		await super._onStartTurn(combatant);
		this._recoverUses({ turn: true, roundStart: combatant });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reset combat specific uses for certain combatants.
	 * @param {Record<string, boolean|BFCombatant>} types - Which types of recovery to handle, and whether they should be
	 *                                                      performed on all combatants or only the combatant specified.
	 */
	async _recoverUses(types) {
		for (const combatant of this.combatants) {
			const periods = Object.entries(types)
				.filter(([, v]) => v === true || v === combatant)
				.map(([k]) => k);
			if (periods.length) await combatant.recoverCombatUses(periods);
		}
	}
}
