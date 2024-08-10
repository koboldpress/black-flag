import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField } = foundry.data.fields;

/**
 * Configuration data for the Utility activity.
 * @property {EffectApplicationData[]} effects - Effects to be applied.
 */
export class UtilityData extends foundry.abstract.DataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.UTILITY"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			effects: new ArrayField(new AppliedEffectField())
		};
	}
}
