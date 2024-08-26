import ChallengeRollConfigurationDialog from "./challenge-configuration-dialog.mjs";

/**
 * @typedef {ChallengeRollConfigurationDialogOptions} AttackRollConfigurationDialogOptions
 * @property {FormSelectOption[]} ammunitionOptions - Ammunition that can be used with the attack.
 * @property {FormSelectOption[]} attackModes - Options for the attack mode.
 * @property {Function} buildConfig - Method for re-building roll after configuration changes.
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
				options: this.options.attackModes,
				value: this.config.attackMode
			});
		if (this.options.ammunitionOptions)
			context.fields.unshift({
				field: new foundry.data.fields.StringField({ label: game.i18n.localize("BF.Item.Type.Ammunition[one]") }),
				name: "ammunition",
				options: [{ value: "", label: "" }, ...this.options.ammunitionOptions],
				value: this.config.ammunition
			});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Roll Handling            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_buildConfig(config, formData, index) {
		config = super._buildConfig(config, formData, index);
		if (!this.options.buildConfig) return config;

		const { rollConfig, rollNotes } = this.options.buildConfig(this.config, config, formData, index);
		this.notes = rollNotes;
		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_handleFormChanges(formData) {
		super._handleFormChanges(formData);
		if (formData.has("ammunition")) this.config.ammunition = formData.get("ammunition");
		if (formData.has("attackMode")) this.config.attackMode = formData.get("attackMode");
	}
}
