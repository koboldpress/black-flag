import ChallengeRollConfigurationDialog from "./challenge-configuration-dialog.mjs";

/**
 * @typedef {ChallengeRollConfigurationDialogOptions} AttackRollConfigurationDialogOptions
 * @property {FormSelectOption[]} attackModes - Options for the attack mode.
 */

/**
 * Roll configuration dialog for Attack Rolls.
 *
 * @param {AttackRollProcessConfiguration} [config={}] - Initial roll configuration.
 * @param {BasicRollMessageConfiguration} [message={}] - Message configuration.
 * @param {AttackRollConfigurationDialogOptions} [options={}] - Dialog rendering options.
 */
export default class AttackRollConfigurationDialog extends ChallengeRollConfigurationDialog {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareConfigurationContext(context, options) {
		context = await super._prepareConfigurationContext(context, options);
		if (this.options.attackModes)
			context.fields.unshift({
				field: new foundry.data.fields.StringField({ label: game.i18n.localize("BF.ATTACK.Mode.Label") }),
				name: "attackMode",
				value: this.config.attackMode,
				options: this.options.attackModes
			});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_handleFormChanges(formData) {
		super._handleFormChanges(formData);
		if (formData.has("attackMode")) this.config.attackMode = formData.get("attackMode");
	}
}
