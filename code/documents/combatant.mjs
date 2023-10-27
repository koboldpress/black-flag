/**
 * Extended version of `Combatant` class to support initiative rolls.
 */
export default class BlackFlagCombatant extends Combatant {

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Methods                                  */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	getInitiativeRoll(formula) {
		if ( formula ) return super.getInitiativeRoll(formula);
		return this.actor?._cachedInitiativeRolls?.[0].clone()
			?? CONFIG.Dice.ChallengeRoll.create(this.actor?.getInitiativeRollConfig() ?? {});
	}
}
