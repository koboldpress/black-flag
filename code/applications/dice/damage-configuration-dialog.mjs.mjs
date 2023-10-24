import BaseConfigurationDialog from "./base-configuration-dialog.mjs";

/**
 * Roll configuration dialog for Damage Rolls.
 */
export default class DamageConfigurationDialog extends BaseConfigurationDialog {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/dice/damage-roll-dialog.hbs",
			rollType: CONFIG.Dice.DamageRoll
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	getButtons() {
		const buttons = {
			critical: { label: game.i18n.localize("BF.Roll.Action.Critical.Label") },
			normal: { label: game.i18n.localize("BF.Roll.Action.Normal.Label") }
		};
		if ( this.rollConfig[0].options.allowCritical === false ) delete buttons.critical;
		return buttons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options={}) {
		return foundry.utils.mergeObject({
			damageTypes: this.options.damageTypes ? Object.fromEntries(Object.entries(CONFIG.BlackFlag.damageTypes)
				.filteR(([k, v]) => this.options.damageTypes.has(k))
			) : null,
			selectedDamageType: this.rolls[0].options.type
		}, super.getData(options));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	finalizeRolls(action) {
		const rolls = [];
		for ( const roll of this.rolls ) {
			roll.options.critical = action === "critical";
			roll.configureRoll();
			rolls.push(roll);
		}
		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	buildConfig(config, formData) {
		if ( formData.damageType ) config.options.type = formData.damageType;
		return config;
	}
}
