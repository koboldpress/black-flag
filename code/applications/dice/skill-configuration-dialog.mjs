import ChallengeRollConfigurationDialog from "./challenge-configuration-dialog.mjs";

/**
 * @typedef {BasicRollConfigurationDialogOptions} SkillRollConfigurationDialogOptions
 * @property {boolean} chooseAbility - Should the ability be selectable?
 */

/**
 * Extended roll configuration dialog that allows selecting abilities.
 */
export default class SkillRollConfigurationDialog extends ChallengeRollConfigurationDialog {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareConfigurationContext(context, options) {
		context = await super._prepareConfigurationContext(context, options);
		if (this.options.chooseAbility)
			context.fields.unshift({
				field: new foundry.data.fields.StringField({
					label: game.i18n.localize("BF.Ability.Label[one]"),
					required: true,
					blank: false
				}),
				name: "ability",
				options: CONFIG.BlackFlag.abilities.localizedOptions,
				value: this.rolls[0]?.data.abilityId
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
}
