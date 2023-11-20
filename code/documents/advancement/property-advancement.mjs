import PropertyConfig from "../../applications/advancement/property-config.mjs";
import { PropertyConfigurationData } from "../../data/advancement/property-data.mjs";
import Advancement from "./advancement.mjs";

export default class PropertyAdvancement extends Advancement {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "property",
		dataModels: {
			configuration: PropertyConfigurationData
		},
		order: 2,
		icon: "systems/black-flag/artwork/advancement/property.svg",
		title: "BF.Advancement.Property.Title",
		hint: "BF.Advancement.Property.Hint",
		apps: {
			config: PropertyConfig
		}
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	changes(levels) {
		return this.configuration.changes;
	}
}
