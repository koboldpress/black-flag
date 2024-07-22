import ChallengeRollConfigurationDialog from "./challenge-configuration-dialog.mjs";

/**
 * Extended roll configuration dialog that allows selecting abilities.
 */
export default class SkillRollConfigurationDialog extends ChallengeRollConfigurationDialog {
	/** @override */
	static PARTS = {
		...super.PARTS,
		configuration: {
			template: "systems/black-flag/templates/dice/skill-configuration.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareConfigurationContext(context, options) {
		context = await super._prepareConfigurationContext(context, options);
		context.ability = this.rolls[0]?.data.abilityId;
		context.chooseAbility = this.options.chooseAbility;
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
