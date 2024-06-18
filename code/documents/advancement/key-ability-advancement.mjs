import { KeyAbilityConfigurationData } from "../../data/advancement/key-ability-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that indicates one or more key abilities for a class. **Can only be added to classes and each class can
 * only have one.**
 */
export default class KeyAbilityAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "keyAbility",
				dataModels: {
					configuration: KeyAbilityConfigurationData
				},
				order: 15,
				icon: "systems/black-flag/artwork/advancement/key-ability.svg",
				title: "BF.Advancement.KeyAbility.Title",
				hint: "BF.Advancement.KeyAbility.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get levels() {
		return [1];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	titleForLevel(levels, { flow = false } = {}) {
		const abilities = Array.from(this.configuration.options)
			.map(o => CONFIG.BlackFlag.abilities.localizedAbbreviations[o])
			.filter(a => a);
		const formatted = game.i18n.getListFormatter({ type: "conjunction", style: "short" }).format(abilities);
		return formatted ? `${this.title}: <em>${formatted}</em>` : this.title;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static availableForItem(item) {
		return !item.system.advancement.byType(this.metadata.type).length;
	}
}
