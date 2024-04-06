import { PropertyConfigurationData } from "../../data/advancement/property-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that applies arbitrary changes to the actor using an ActiveEffect-like system.
 */
export default class PropertyAdvancement extends Advancement {
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "property",
				dataModels: {
					configuration: PropertyConfigurationData
				},
				order: 2,
				icon: "systems/black-flag/artwork/advancement/property.svg",
				title: "BF.Advancement.Property.Title",
				hint: "BF.Advancement.Property.Hint",
				configurableHint: true
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	changes(levels) {
		return this.configuration.changes;
	}
}
