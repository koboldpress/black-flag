import PropertyConfig from "../../applications/advancement/property-config.mjs";
import { PropertyConfigurationData } from "../../data/advancement/property-data.mjs";
import Advancement from "./advancement.mjs";

export default class PropertyAdvancement extends Advancement {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "property",
			dataModels: {
				configuration: PropertyConfigurationData
			},
			order: 2,
			icon: "systems/black-flag/artwork/advancement/property.svg",
			title: game.i18n.localize("BF.Advancement.Property.Title"),
			hint: game.i18n.localize("BF.Advancement.Property.Hint"),
			apps: {
				config: PropertyConfig
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	changes(levels) {
		return this.configuration.changes;
	}
}
