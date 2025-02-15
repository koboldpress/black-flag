import AdvancementFlow from "./advancement-flow.mjs";
import SpellcastingDialog from "./spellcasting-dialog.mjs";

/**
 * Inline application that presents spell learning at level up.
 */
export default class SpellcastingFlow extends AdvancementFlow {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/spellcasting-flow.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options = {}) {
		const context = super.getData(options);
		const level = this.advancement.relavantLevel(this.levels);
		const stats = this.advancement.statsForLevel(this.levels);
		const validLevel = this.advancement.learnsSpellsAt(level) || this.advancement.replacesSpellAt(level);
		context.showLearnSpells = (validLevel && context.modes.editing) || stats.needToLearn;
		context.showReplacement =
			!context.showLearnSpells && this.advancement.replacesSpellAt(level) && stats.get("replacement").toLearn;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _updateObject(event, formData) {
		const action = event.submitter.dataset.action;
		if (action === "learn-spells") new SpellcastingDialog(this.advancement, this.levels).render({ force: true });
	}
}
