import AdvancementFlow from "./advancement-flow-v2.mjs";

const { StringField } = foundry.data.fields;

/**
 * Inline application that presents ability selection for granting spells
 */
export default class GrantSpellsFlow extends AdvancementFlow {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActionsContext(context, options) {
		context = await super._prepareActionsContext(context, options);
		if (context.needsConfiguration && this.advancement.configuration.spell.ability.size > 1)
			context.actions.push({
				field: new StringField(),
				name: "ability",
				options: [
					{ value: "", label: _loc("BF.Advancement.GrantSpells.Notification.Ability"), rule: true },
					...Array.from(this.advancement.configuration.spell.ability).map(value => ({
						value,
						label: CONFIG.BlackFlag.abilities.localized[value]
					}))
				]
			});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareControlsContext(context, options) {
		context = await super._prepareControlsContext(context, options);
		context.showReverse =
			context.editable && !context.needsConfiguration && this.advancement.configuration.spell.ability.size > 1;
		context.reverseLabel = "BF.Advancement.GrantSpells.Action.Reselect";
		return context;
	}
}
