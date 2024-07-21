import { log } from "../utils/_module.mjs";
import BasicRoll from "./basic-roll.mjs";
import ChallengeDie from "./challenge-die.mjs";
import ChallengeRoll from "./challenge-roll.mjs";
import DamageRoll from "./damage-roll.mjs";

/**
 * Register the various roll types provided by Black Flag during initialization.
 */
export function registerDice() {
	log("Registering roll & die types");

	CONFIG.Dice.BasicRoll = BasicRoll;
	CONFIG.Dice.ChallengeDie = ChallengeDie;
	CONFIG.Dice.ChallengeRoll = ChallengeRoll;
	CONFIG.Dice.DamageRoll = DamageRoll;
	CONFIG.Dice.types.push(ChallengeDie);
	CONFIG.Dice.rolls = [BasicRoll, ChallengeRoll, DamageRoll];
}

export { BasicRoll, ChallengeDie, ChallengeRoll, DamageRoll };
export { default as aggregateDamageRolls } from "./aggregate-damage-rolls.mjs";
