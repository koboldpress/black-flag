const { BooleanField, DocumentIdField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Spellcasting advancement.
 */
export class SpellcastingConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new StringField({initial: "leveled", label: "BF.Spellcasting.Type.Label"}),
			progression: new StringField({label: "BF.Spellcasting.Progression.Label"}),
			// TODO: Is there a need to set spellcasting ability different than the class's key ability?
			preparation: new BooleanField({initial: true, label: "BF.Spellcasting.Prepared.Label"}),
			circle: new StringField({label: "BF.Spell.Circle.Label"}),
			focus: new StringField(),
			cantrips: new DocumentIdField(),
			rituals: new DocumentIdField()
			// TODO: Add system for granting spells at level-up
		};
	}
}
