const { SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Key Ability advancement.
 */
export class KeyAbilityConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			options: new SetField(new StringField(), {
				label: "BF.Advancement.KeyAbility.Options.Label",
				hint: "BF.Advancement.KeyAbility.Options.Hint"
			})
		};
	}
}
