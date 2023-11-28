import { DamageField, FormulaField } from "../fields/_module.mjs";

const { ArrayField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the saving throw activity.
 */
export class SavingThrowData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			ability: new StringField({
				initial: () => Object.keys(CONFIG.BlackFlag.abilities)[0],
				 label: "BF.Activity.SavingThrow.OpposedAbility.Label"
			 }),
			damage: new SchemaField({
				parts: new ArrayField(new DamageField())
			}, {label: "BF.Damage.Label"}),
			// TODO: Add conditions that can be imposed
			dc: new SchemaField({
				ability: new StringField({label: "BF.DifficultyClass.Ability.Label"}),
				formula: new FormulaField({deterministic: true, label: "BF.DifficultyClass.Formula.Label"})
			}, {label: "BF.DifficultyClass.Label"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareData() {
		const item = this.parent.item.system ?? {};
		const propertiesToSet = ["type.classification"];
		for ( const keyPath of propertiesToSet ) {
			const activityProperty = foundry.utils.getProperty(this, keyPath);
			const itemProperty = foundry.utils.getProperty(item, keyPath);
			if ( !activityProperty && itemProperty ) foundry.utils.setProperty(this, keyPath, itemProperty);
		}
	}
}
