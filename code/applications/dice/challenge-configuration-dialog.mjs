import BaseConfigurationDialog from "./base-configuration-dialog.mjs";

/**
 * Roll configuration dialog for Challenge Rolls.
 */
export default class ChallengeConfigurationDialog extends BaseConfigurationDialog {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			rollType: CONFIG.Dice.ChallengeRoll
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	getButtons() {
		return {
			advantage: { label: game.i18n.localize("BF.Roll.Action.Advantage.Label") },
			normal: { label: game.i18n.localize("BF.Roll.Action.Normal.Label") },
			disadvantage: { label: game.i18n.localize("BF.Roll.Action.Disadvantage.Label") }
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options={}) {
		const context = super.getData(options);
		context.rollNotes.forEach(n => {
			switch (n.note?.rollMode) {
				case CONFIG.Dice.ChallengeDie.MODES.ADVANTAGE:
					return n.advantageAbbreviation = "BF.Roll.Action.Advantage.Abbreviation";
				case CONFIG.Dice.ChallengeDie.MODES.DISADVANTAGE:
					return n.advantageAbbreviation = "BF.Roll.Action.Disadvantage.Abbreviation";
				case CONFIG.Dice.ChallengeDie.MODES.NORMAL:
					return n.advantageAbbreviation = "BF.Roll.Action.Normal.Abbreviation";
			}
		});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	finalizeRolls(action) {
		const rolls = [];
		for ( const roll of this.rolls ) {
			switch (action) {
				case "advantage":
					roll.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.ADVANTAGE;
					break;
				case "disadvantage":
					roll.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.DISADVANTAGE;
					break;
				case "normal":
					roll.options.advantageMode = CONFIG.Dice.ChallengeDie.MODES.NORMAL;
					break;
			}
			roll.configureRoll();
			rolls.push(roll);
		}
		return rolls;
	}
}
