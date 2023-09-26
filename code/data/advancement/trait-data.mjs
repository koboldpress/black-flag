/**
 * Configuration data for the Trait advancement.
 */
export class TraitConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			mode: new foundry.data.fields.StringField({initial: "default"}),
			grants: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				label: "BF.Advancement.Trait.Guaranteed.Label", hint: "BF.Advancement.Trait.Guaranteed.Hint"
			}),
			choices: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
				count: new foundry.data.fields.NumberField({
					initial: 1, positive: true, integer: true, label: "BF.Advancement.Trait.Count.Label"
				}),
				pool: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
			}), {label: "BF.Advancement.Trait.Choices.Label", hint: "BF.Advancement.Trait.Choices.Hint"})
		};
	}
}

/**
 * Value data for the Trait advancement.
 */
export class TraitValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			selected: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				required: false, initial: undefined
			})
		};
	}
}
