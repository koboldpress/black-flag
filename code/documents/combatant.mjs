/**
 * Extended version of `Combatant` class to support initiative rolls.
 */
export default class BlackFlagCombatant extends Combatant {

	getInitiativeRoll(formula) {
		if ( formula ) return super.getInitiativeRoll(formula);
		return this.actor?._cachedInitiativeRolls?.[0].clone()
			?? CONFIG.Dice.ChallengeRoll.create(this.actor?.getInitiativeRollConfig() ?? {});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reset combat-related uses.
	 * @param {string[]} periods - Which recovery periods should be considered.
	 * @returns {Promise<Combatant>}
	 */
	async recoverCombatUses(periods) {
		const updates = [];
		const rolls = [];
		const rollData = this.actor?.getRollData();
		for ( const item of this.actor?.items ?? [] ) {
			if ( foundry.utils.getType(item.system.recoverUses) !== "function" ) continue;
			const results = await item.system.recoverUses(periods, rollData);
			if ( foundry.utils.isEmpty(results.updates) ) continue;
			updates.push({ _id: item.id, ...results.updates });
			rolls.push(...rolls);
		}
		if ( updates.length ) await this.actor.updateEmbeddedDocuments("Item", updates);
		// TODO: Consider displaying rolls in message

		return this;
	}
}
