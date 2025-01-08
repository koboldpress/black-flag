/**
 * Extended version of `Combatant` class to support initiative rolls.
 */
export default class BlackFlagCombatant extends Combatant {
	/** @inheritDoc */
	getInitiativeRoll(formula) {
		if (formula) return super.getInitiativeRoll(formula);
		if (this.actor?._cachedInitiativeRolls?.[0]) return this.actor._cachedInitiativeRolls[0].clone();
		const config = this.actor?.getInitiativeRollConfig() ?? {};
		if (config.fixed !== undefined) return new CONFIG.Dice.BasicRoll(`${config.fixed}`);
		return CONFIG.Dice.ChallengeRoll.fromConfig(config.rolls[0]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reset combat-related uses.
	 * @param {string[]} periods - Which recovery periods should be considered.
	 * @returns {Promise<Combatant>}
	 */
	async recoverCombatUses(periods) {
		await this.actor?.system.recoverCombatUses?.(periods);

		const updates = [];
		const rolls = [];
		const rollData = this.actor?.getRollData();
		for (const item of this.actor?.items ?? []) {
			if (foundry.utils.getType(item.system.recoverUses) !== "function") continue;
			const results = await item.system.recoverUses(periods, rollData);
			if (foundry.utils.isEmpty(results.updates)) continue;
			updates.push({ _id: item.id, ...results.updates });
			rolls.push(...rolls);
		}
		if (updates.length) await this.actor.updateEmbeddedDocuments("Item", updates);
		// TODO: Consider displaying rolls in message

		return this;
	}
}
