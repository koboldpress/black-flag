const { SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Key Ability advancement.
 */
export class KeyAbilityConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			options: new SetField(new StringField(), {
				label: "BF.Advancement.KeyAbility.Options.Label", hint: "BF.Advancement.KeyAbility.Options.Hint"
			}),
			secondary: new StringField({
				label: "BF.Advancement.KeyAbility.Secondary.Label", hint: "BF.Advancement.KeyAbility.Secondary.Hint"
			})
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Key Ability advancement.
 *
 * @property {string} selected - Which ability was selected as key?
 */
export class KeyAbilityValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			selected: new StringField({label: "BF.Advancement.KeyAbility.Label"})
		};
	}
}
