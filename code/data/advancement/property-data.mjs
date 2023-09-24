/**
 * Configuration data for the Property advancement.
 */
export class PropertyConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			changes: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
				key: new foundry.data.fields.StringField({required: true, label: "EFFECT.ChangeKey"}),
				value: new foundry.data.fields.StringField({required: true, label: "EFFECT.ChangeValue"}),
				mode: new foundry.data.fields.NumberField({
					integer: true, initial: CONST.ACTIVE_EFFECT_MODES.ADD, label: "EFFECT.ChangeMode"
				}),
				priority: new foundry.data.fields.NumberField()
			}))
		};
	}
}
