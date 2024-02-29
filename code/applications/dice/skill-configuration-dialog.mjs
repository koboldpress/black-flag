import ChallengeRollConfigurationDialog from "./challenge-configuration-dialog.mjs";

/**
 * Extended roll configuration dialog that allows selecting abilities.
 */
export default class SkillRollConfigurationDialog extends ChallengeRollConfigurationDialog {

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/dice/skill-roll-dialog.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options={}) {
		return foundry.utils.mergeObject({
			abilities: Object.entries(CONFIG.BlackFlag.abilities).reduce((obj, [key, ability]) => {
				obj[key] = ability.labels.full;
				return obj;
			}, {}),
			selectedAbility: this.rolls[0].data.abilityId
		}, super.getData(options));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_buildConfig(config, formData, index) {
		const { rollConfig, rollNotes } = this.options.buildConfig(config, formData);
		this.options.rollNotes = rollNotes;
		return rollConfig;
	}
}
