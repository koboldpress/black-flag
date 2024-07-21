import BasicRollConfigurationDialog from "./basic-configuration-dialog.mjs";

/**
 * Roll configuration dialog for Damage Rolls.
 */
export default class DamageRollConfigurationDialog extends BasicRollConfigurationDialog {
	/** @override */
	static PARTS = {
		...super.PARTS,
		formulas: {
			template: "systems/black-flag/templates/dice/damage-formulas.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static get rollType() {
		return CONFIG.Dice.DamageRoll;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_prepareButtonsContext(context, options) {
		context.buttons = {
			critical: {
				icon: '<i class="fa-solid fa-bomb"></i>',
				label: game.i18n.localize("BF.Roll.Action.Critical.Label")
			},
			normal: {
				icon: '<i class="fa-solid fa-dice"></i>',
				label: game.i18n.localize("BF.Roll.Action.Normal.Label")
			}
		};
		if (this.config.allowCritical === false) delete context.buttons.critical;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Roll Handling            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_buildConfig(config, formData, index) {
		console.log(this.options);
		// TODO: Rework this so each roll can have damage type selection
		// if (formData.damageType) config.options.damageType = formData.damageType;
		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_finalizeRolls(action) {
		const rolls = [];
		for (const roll of this.rolls) {
			roll.options.isCritical = action === "critical";
			roll.configureRoll({ critical: this.config.critical });
			rolls.push(roll);
		}
		return rolls;
	}
}
