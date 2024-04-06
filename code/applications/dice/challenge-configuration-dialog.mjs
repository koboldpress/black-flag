import BasicRollConfigurationDialog from "./basic-configuration-dialog.mjs";

/**
 * @typedef {BasicRollConfigurationDialogOptions} ChallengeRollConfigurationDialogOptions
 * @property {boolean} [chooseAbility=false] - Should the ability selector be shown?
 */

/**
 * Roll configuration dialog for Challenge Rolls.
 *
 * @param {ChallengeRollConfiguration[]} [rollConfig=[]] - Initial roll configurations.
 * @param {ChallengeRollConfigurationDialogOptions} [options={}] - Dialog rendering options.
 */
export default class ChallengeRollConfigurationDialog extends BasicRollConfigurationDialog {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			rollType: CONFIG.Dice.ChallengeRoll
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getButtons() {
		return {
			advantage: { label: game.i18n.localize("BF.Roll.Action.Advantage.Label") },
			normal: { label: game.i18n.localize("BF.Roll.Action.Normal.Label") },
			disadvantage: { label: game.i18n.localize("BF.Roll.Action.Disadvantage.Label") }
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options = {}) {
		const context = super.getData(options);
		context.rollNotes.forEach(n => {
			switch (n.note?.rollMode) {
				case CONFIG.Dice.ChallengeDie.MODES.ADVANTAGE:
					return (n.advantageAbbreviation = "BF.Roll.Action.Advantage.Abbreviation");
				case CONFIG.Dice.ChallengeDie.MODES.DISADVANTAGE:
					return (n.advantageAbbreviation = "BF.Roll.Action.Disadvantage.Abbreviation");
				case CONFIG.Dice.ChallengeDie.MODES.NORMAL:
					return (n.advantageAbbreviation = "BF.Roll.Action.Normal.Abbreviation");
			}
		});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Roll Handling            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_finalizeRolls(action) {
		const rolls = [];
		for (const roll of this.rolls) {
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
