import AdvancementFlow from "./advancement-flow.mjs";

/**
 * Inline application that presents ability selection for granting spells
 */
export default class GrantSpellsFlow extends AdvancementFlow {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/grant-spells-flow.hbs",
			submitOnChange: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData() {
		return foundry.utils.mergeObject(super.getData(), {
			abilities: Array.from(this.advancement.configuration.spell.ability).reduce((obj, key) => {
				obj[key] = CONFIG.BlackFlag.abilities.localized[key];
				return obj;
			}, {}),
			abilitySelection: this.advancement.configuration.spell.ability.size > 1
		});
	}
}
