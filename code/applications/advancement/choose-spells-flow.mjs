import ChooseFeaturesFlow from "./choose-features-flow.mjs";

const { StringField } = foundry.data.fields;

/**
 * Inline application that presents a list of spell choices.
 */
export default class ChooseSpellsFlow extends ChooseFeaturesFlow {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActionsContext(context, options) {
		context = await super._prepareActionsContext(context, options);
		const needsAbilitySelection =
			this.advancement.configuration.spell.ability.size > 1 && !this.advancement.value.ability;
		if (needsAbilitySelection)
			context.actions = [
				{
					field: new StringField(),
					name: "ability",
					options: [
						{ value: "", label: _loc("BF.Advancement.GrantSpells.Notification.Ability"), rule: true },
						...Array.from(this.advancement.configuration.spell.ability).map(value => ({
							value,
							label: CONFIG.BlackFlag.abilities.localized[value]
						}))
					]
				}
			];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareControlsContext(context, options) {
		context = await super._prepareControlsContext(context, options);
		const abilitySelection = this.advancement.configuration.spell.ability.size > 1;
		const needsAbilitySelection = abilitySelection && !this.advancement.value.ability;
		const isFirstLevel = this.advancement.relavantLevel(this.levels) === this.advancement.levels[0];
		context.showReverse = context.editable && abilitySelection && !needsAbilitySelection && isFirstLevel;
		context.reverseLabel = "BF.Advancement.ChooseFeatures.Action.Revert";
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _handleForm(event, formData) {
		if (formData.object.ability) this.advancement.apply(this.levels, formData.object);
		else super._handleForm(event, formData);
	}
}
