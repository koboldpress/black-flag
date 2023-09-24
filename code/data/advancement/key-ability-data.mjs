/**
 * Configuration data for the Key Ability advancement.
 */
export class KeyAbilityConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			options: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				label: "BF.Advancement.KeyAbility.Options.Label", hint: "BF.Advancement.KeyAbility.Options.Hint"
			}),
			secondary: new foundry.data.fields.StringField({
				label: "BF.Advancement.KeyAbility.Secondary.Label", hint: "BF.Advancement.KeyAbility.Secondary.Hint"
			})
		};
	}
}

/**
 * Value data for the Size advancement.
 */
export class KeyAbilityValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			selected: new foundry.data.fields.StringField({label: "BF.Advancement.KeyAbility.Label"})
		};
	}
}
