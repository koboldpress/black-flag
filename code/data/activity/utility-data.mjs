import FormulaField from "../fields/formula-field.mjs";
import AppliedEffectField from "./fields/applied-effect-field.mjs";

const { ArrayField, BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Utility activity.
 * @property {EffectApplicationData[]} effects - Effects to be applied.
 * @property {object} roll
 * @property {string} roll.formula - Arbitrary formula that can be rolled.
 * @property {string} roll.name - Label for the rolling button.
 * @property {boolean} roll.prompt - Should the roll configuration dialog be displayed?
 * @property {boolean} roll.visible - Should the rolling button be visible to all players?
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
			effects: new ArrayField(new AppliedEffectField()),
			roll: new SchemaField({
				formula: new FormulaField(),
				name: new StringField(),
				prompt: new BooleanField(),
				visible: new BooleanField()
			})
		};
	}
}
