import * as fields from "../fields/_module.mjs";

/**
 * Configuration data for the attack activity.
 */
export class AttackData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.StringField({label: "BF.Weapon.Type.Label"}),
				classification: new foundry.data.fields.StringField({label: "BF.Attack.Classification.Label"})
			}),
			damage: new foundry.data.fields.SchemaField({
				includeBaseDamage: new foundry.data.fields.BooleanField({
					initial: true, label: "BF.Activity.Attack.IncludeBaseDamage.Label",
					hint: "BF.Activity.Attack.IncludeBaseDamage.Hint"
				}),
				parts: new foundry.data.fields.ArrayField(new fields.DamageField())
				// TODO: Add conditions support to damage parts
			}, {label: "BF.Damage.Label"})
		};
	}
}
