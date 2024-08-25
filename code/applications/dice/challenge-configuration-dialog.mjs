import BasicRollConfigurationDialog from "./basic-configuration-dialog.mjs";

/**
 * @typedef {BasicRollConfigurationDialogOptions} ChallengeRollConfigurationDialogOptions
 * @property {boolean} [chooseAbility=false] - Should the ability selector be shown?
 */

/**
 * Roll configuration dialog for Challenge Rolls.
 *
 * @param {ChallengeRollProcessConfiguration} [config={}] - Initial roll configuration.
 * @param {BasicRollMessageConfiguration} [message={}] - Message configuration.
 * @param {ChallengeRollConfigurationDialogOptions} [options={}] - Dialog rendering options.
 */
export default class ChallengeRollConfigurationDialog extends BasicRollConfigurationDialog {
	/** @override */
	static get rollType() {
		return CONFIG.Dice.ChallengeRoll;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _prepareButtonsContext(context, options) {
		context.buttons = {
			advantage: {
				icon: '<i class="fa-solid fa-square-caret-up"></i>',
				label: game.i18n.localize("BF.Roll.Action.Advantage.Label")
			},
			normal: {
				icon: '<i class="fa-solid fa-dice"></i>',
				label: game.i18n.localize("BF.Roll.Action.Normal.Label")
			},
			disadvantage: {
				icon: '<i class="fa-solid fa-square-caret-down"></i>',
				label: game.i18n.localize("BF.Roll.Action.Disadvantage.Label")
			}
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareNotesContext(context, options) {
		context = await super._prepareNotesContext(context, options);
		context.notes.forEach(n => {
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
