import ChooseFeaturesFlow from "./choose-features-flow.mjs";

/**
 * Inline application that presents a list of spell choices.
 */
export default class ChooseSpellsFlow extends ChooseFeaturesFlow {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/choose-spells-flow.hbs",
			submitOnChange: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData() {
		const context = super.getData();
		context.abilities = Array.from(this.advancement.configuration.spell.ability).reduce((obj, key) => {
			obj[key] = CONFIG.BlackFlag.abilities.localized[key];
			return obj;
		}, {});
		context.abilitySelection = this.advancement.configuration.spell.ability.size > 1;
		context.needsAbilitySelection = context.abilitySelection && !this.advancement.value.ability;
		context.isFirstLevel = this.advancement.relavantLevel(this.levels) === this.advancement.levels[0];
		context.showReselectAbility =
			context.modes.editing && context.abilitySelection && !context.needsAbilitySelection && context.isFirstLevel;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _updateObject(event, formData) {
		if (formData.ability) this.advancement.apply(this.levels, formData);
		else super._updateObject(event, formData);
	}
}
