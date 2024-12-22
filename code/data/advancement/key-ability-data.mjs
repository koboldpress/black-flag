import AdvancementDataModel from "../abstract/advancement-data-model.mjs";

const { SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Key Ability advancement.
 */
export class KeyAbilityConfigurationData extends AdvancementDataModel {
	static defineSchema() {
		return {
			options: new SetField(new StringField(), {
				label: "BF.Advancement.KeyAbility.Options.Label",
				hint: "BF.Advancement.KeyAbility.Options.Hint"
			})
		};
	}
}
