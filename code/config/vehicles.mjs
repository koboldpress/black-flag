import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of vehicles offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const vehicles = {
	air: {
		localization: "BF.VEHICLE.Category.Air"
	},
	land: {
		localization: "BF.VEHICLE.Category.Land"
	},
	water: {
		localization: "BF.VEHICLE.Category.Water"
	}
};
localizeConfig(vehicles);
localizeConfig(vehicles, { pluralRule: "other", propertyName: "localizedPlural" });
