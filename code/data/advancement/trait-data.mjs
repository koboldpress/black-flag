const { ArrayField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Trait advancement.
 */
export class TraitConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			hint: new StringField({
				label: "BF.Advancement.Core.Hint.Label", hint: "BF.Advancement.Core.Hint.Hint"
			}),
			mode: new StringField({initial: "default"}),
			grants: new SetField(new StringField(), {
				label: "BF.Advancement.Trait.Guaranteed.Label", hint: "BF.Advancement.Trait.Guaranteed.Hint"
			}),
			choices: new ArrayField(new SchemaField({
				count: new NumberField({
					initial: 1, positive: true, integer: true, label: "BF.Advancement.Trait.Count.Label"
				}),
				pool: new SetField(new StringField())
			}), {label: "BF.Advancement.Trait.Choices.Label", hint: "BF.Advancement.Trait.Choices.Hint"}),
			choiceMode: new StringField({
				initial: "inclusive", label: "BF.Advancement.Trait.Choice.Mode.Label",
				hint: "BF.Advancement.Trait.Choice.Mode.Hint"
			})
		};
	}
}

/**
 * Value data for the Trait advancement.
 */
export class TraitValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			selected: new SetField(new StringField(), {
				required: false, initial: undefined
			})
		};
	}
}
