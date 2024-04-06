import { MappingField } from "../fields/_module.mjs";

const { JSONField, NumberField } = foundry.data.fields;

/**
 * Configuration data for the Hit Points advancement.
 *
 * @property {string} denomination - Size of hit die available.
 */
export class HitPointsConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			denomination: new NumberField({ initial: 4, label: "BF.HitDice.Label[one]" })
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Hit Points advancement.
 *
 * @property {{[key: number]: object}} granted - Hit points granted at various levels. This is stored as stringified
 *                                               JSON containing either a serialized roll or a string indicating that
 *                                               the "avg" or "max" values were taken for a level.
 */
export class HitPointsValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			granted: new MappingField(new JSONField(), { required: false, initial: undefined })
		};
	}
}
