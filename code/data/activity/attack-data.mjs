import { DamageField } from "../fields/_module.mjs";

const { ArrayField, BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the attack activity.
 */
export class AttackData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new SchemaField({
				value: new StringField({label: "BF.Weapon.Type.Label"}),
				classification: new StringField({label: "BF.Attack.Classification.Label"})
			}),
			ability: new StringField(),
			damage: new SchemaField({
				includeBaseDamage: new BooleanField({
					initial: true, label: "BF.Activity.Attack.IncludeBaseDamage.Label",
					hint: "BF.Activity.Attack.IncludeBaseDamage.Hint"
				}),
				parts: new ArrayField(new DamageField())
				// TODO: Add conditions support to damage parts
			}, {label: "BF.Damage.Label"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareData() {
		const item = this.parent.item.system ?? {};
		const propertiesToSet = ["type.value", "type.classification"];
		for ( const keyPath of propertiesToSet ) {
			const activityProperty = foundry.utils.getProperty(this, keyPath);
			const itemProperty = foundry.utils.getProperty(item, keyPath);
			if ( !activityProperty && itemProperty ) foundry.utils.setProperty(this, keyPath, itemProperty);
		}
	}
}
