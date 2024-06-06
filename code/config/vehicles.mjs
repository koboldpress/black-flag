import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of vehicles offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const vehicles = {
	land: {
		localization: "BF.Vehicle.Category.Land"
	},
	water: {
		localization: "BF.Vehicle.Category.Water"
	}
};
localizeConfig(vehicles, { pluralRule: "other" });
