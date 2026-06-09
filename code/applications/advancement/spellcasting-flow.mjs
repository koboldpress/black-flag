import AdvancementFlow from "./advancement-flow.mjs";
import SpellcastingDialog from "./spellcasting-dialog.mjs";

/**
 * Inline application that presents spell learning at level up.
 */
export default class SpellcastingFlow extends AdvancementFlow {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActionsContext(context, options) {
		context = await super._prepareActionsContext(context, options);
		const level = this.advancement.relavantLevel(this.levels);
		const stats = this.advancement.statsForLevel(this.levels);
		const validLevel = this.advancement.learnsSpellsAt(level) || this.advancement.replacesSpellAt(level);

		if ((validLevel && context.editable) || stats.needToLearn)
			context.actions.push({
				type: "submit",
				classes: "light-button",
				action: "learnSpells",
				label: _loc("BF.Advancement.Spellcasting.Action.LearnSpells")
			});
		else if (this.advancement.replacesSpellAt(level) && stats.get("replacement").toLearn)
			context.actions.push({
				type: "submit",
				classes: "link-button",
				action: "learnSpells",
				label: `
				<i class="fa-solid fa-shuffle" inert></i>
				${_loc("BF.Advancement.Spellcasting.Action.ReplaceSpell")}
			`
			});

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _handleForm(event, form, formData) {
		const action = event.submitter.dataset.action;
		if (action === "learnSpells") this.actor.sheet._renderChild(new SpellcastingDialog(this.advancement, this.levels));
	}
}
