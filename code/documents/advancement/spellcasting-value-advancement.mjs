import { SpellcastingValueConfigurationData } from "../../data/advancement/spellcasting-value-data.mjs";
import ScaleValueAdvancement from "./scale-value-advancement.mjs";

/**
 * Advancement that represents spells, rituals, or cantrips known.
 */
export default class SpellcastingValueAdvancement extends ScaleValueAdvancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "spellcastingValue",
				dataModels: {
					configuration: SpellcastingValueConfigurationData
				},
				order: 37,
				title: "BF.Advancement.SpellcastingScale.Title",
				identifier: {
					configurable: false
				},
				configurableHint: false,
				multiLevel: true
			},
			{ inplace: false }
		)
	);
}
