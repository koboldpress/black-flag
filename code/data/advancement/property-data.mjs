const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Property advancement.
 */
export class PropertyConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			changes: new ArrayField(
				new SchemaField({
					key: new StringField({ required: true, label: "EFFECT.ChangeKey" }),
					value: new StringField({ required: true, label: "EFFECT.ChangeValue" }),
					mode: new NumberField({
						integer: true,
						initial: CONST.ACTIVE_EFFECT_MODES.ADD,
						label: "EFFECT.ChangeMode"
					}),
					priority: new NumberField()
				})
			)
		};
	}
}
