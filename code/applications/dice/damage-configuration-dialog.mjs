import BasicRollConfigurationDialog from "./basic-configuration-dialog.mjs";

/**
 * Roll configuration dialog for Damage Rolls.
 */
export default class DamageRollConfigurationDialog extends BasicRollConfigurationDialog {

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/dice/damage-roll-dialog.hbs",
			rollType: CONFIG.Dice.DamageRoll
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getButtons() {
		const buttons = {
			critical: { label: game.i18n.localize("BF.Roll.Action.Critical.Label") },
			normal: { label: game.i18n.localize("BF.Roll.Action.Normal.Label") }
		};
		if ( this.config.allowCritical === false
			|| this.config.rolls?.every(r => r.options.allowCritical === false) ) delete buttons.critical;
		return buttons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options={}) {
		return foundry.utils.mergeObject({
			damageTypes: this.options.damageTypes ? Object.fromEntries(Object.entries(CONFIG.BlackFlag.damageTypes)
				.filter(([k, v]) => this.options.damageTypes.has(k))
			) : null,
			selectedDamageType: this.rolls[0].options.damageType
		}, super.getData(options));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Roll Handling            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_buildConfig(config, formData, index) {
		// TODO: Rework this so each roll can have damage type selection
		if ( formData.damageType ) config.options.damageType = formData.damageType;
		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_finalizeRolls(action) {
		const rolls = [];
		for ( const roll of this.rolls ) {
			roll.options.critical = action === "critical";
			roll.configureRoll();
			rolls.push(roll);
		}
		return rolls;
	}
}
