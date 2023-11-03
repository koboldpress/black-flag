import FormulaField from "../fields/formula-field.mjs";

const { BooleanField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Spellcasting advancement.
 */
export class SpellcastingConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new StringField({initial: "leveled", label: "BF.Spellcasting.Type.Label"}),
			progression: new StringField({
				label: "BF.Spellcasting.Progression.Label", hint: "BF.Spellcasting.Progression.Hint"
			}),
			// TODO: Is there a need to set spellcasting ability different than the class's key ability?
			circle: new StringField({label: "BF.Spell.Circle.Label"}),
			preparation: new BooleanField({initial: true, label: "BF.Spellcasting.Prepared.Label"}),
			focus: new StringField(),
			cantrips: new FormulaField({
				deterministic: true, label: "BF.Spellcasting.CantripsKnown.Label", hint: "BF.Spellcasting.CantripsKnown.Hint"
			}),
			rituals: new FormulaField({
				deterministic: true, label: "BF.Spellcasting.RitualsKnown.Label", hint: "BF.Spellcasting.RitualsKnown.Hint"
			})
			// TODO: Add system for granting spells at level-up
		};
	}
}
