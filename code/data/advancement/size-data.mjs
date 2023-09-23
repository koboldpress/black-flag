/**
 * Configuration data for the Size advancement.
 */
export class SizeConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			options: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				initial: ["small", "medium"], label: "BF.Advancement.Size.Options.Label", hint: "BF.Advancement.Size.Options.Hint"
			})
		};
	}
}

/**
 * Value data for the Size advancement.
 */
export class SizeValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			selected: new foundry.data.fields.StringField({label: "BF.Size.Label"})
		};
	}
}
