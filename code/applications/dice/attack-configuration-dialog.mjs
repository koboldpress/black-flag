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
	/** @override */
	static PARTS = {
		...super.PARTS,
		configuration: {
			template: "systems/black-flag/templates/dice/attack-configuration.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_handleFormChanges(formData) {
		super._handleFormChanges(formData);
		if (formData.has("attackMode")) this.config.attackMode = formData.get("attackMode");
	}
}
