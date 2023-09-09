import PCSheet from "../../applications/actor/pc-sheet.mjs";
import FormulaField from "../fields/formula-field.mjs";
import MappingField from "../fields/mapping-field.mjs";

export default class PCData extends foundry.abstract.TypeDataModel {

	static metadata = {
		type: "pc",
		category: "person",
		localization: "ToV.Actor.Type.PC",
		sheet: {
			application: PCSheet,
			label: "BF.Sheet.PC"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			abilities: new MappingField(new foundry.data.fields.SchemaField({
				base: new foundry.data.fields.NumberField({min: 0, integer: true}),
				max: new foundry.data.fields.NumberField({min: 0, initial: 20, integer: true}),
				saveProficiency: new foundry.data.fields.SchemaField({
					multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 1, step: 0.5})
				})
				// Bonuses?
				// Minimums?
			})),
			attributes: new foundry.data.fields.SchemaField({
				ac: new foundry.data.fields.SchemaField({
					// Formulas
					// Override
				}),
				death: new foundry.data.fields.SchemaField({
					// Successes
					// Failures
					// Successes required override
					// Failures required override
					// Target threshold override
				}),
				hd: new foundry.data.fields.SchemaField({
					// Spent per denomination
					// Minimum roll
					// Recovery percentage
				}),
				hp: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, integer: true}),
					temp: new foundry.data.fields.NumberField({min: 0, integer: true})
					// Temp max
					// Bonuses
					// Multiplier
				}),
				// Initiative?
				luck: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, max: 5, integer: true})
				})
			}),
			biography: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField(),
				age: new foundry.data.fields.StringField(),
				height: new foundry.data.fields.StringField(),
				weight: new foundry.data.fields.StringField(),
				eyes: new foundry.data.fields.StringField(),
				skin: new foundry.data.fields.StringField(),
				hair: new foundry.data.fields.StringField()
				// Motivation?
				// Backstory?
				// Allies & Organizations?
			}),
			proficiencies: new foundry.data.fields.SchemaField({
				armor: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				}),
				languages: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField()),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				skills: new MappingField(new foundry.data.fields.SchemaField({
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 1, step: 0.5})
					})
					// Bonuses?
					// Minimum?
				})),
				tools: new MappingField(new foundry.data.fields.SchemaField({
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 1, step: 0.5})
					})
					// Default ability
					// Bonuses?
					// Minimum?
				})),
				weapons: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				})
			}),
			progression: new foundry.data.fields.SchemaField({
				// XP
				// Levels
				// Advancement choices
			}),
			// Rolls (contains bonuses, minimums, ability overrides, etc.)?
			// Spellcasting
			traits: new foundry.data.fields.SchemaField({
				movement: new foundry.data.fields.SchemaField({
					base: new foundry.data.fields.NumberField({nullable: false, initial: 30, min: 0, step: 0.1}),
					types: new MappingField(new FormulaField({deterministic: true})),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
					// Units?
					// Multiplier
				}),
				senses: new foundry.data.fields.SchemaField({
					types: new MappingField(new FormulaField({deterministic: true})),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				size: new foundry.data.fields.StringField(),
				type: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.StringField(),
					tags: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				}),
				resistances: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField()),
					bypasses: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				immunities: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField()),
					bypasses: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				vulnerabilities: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				}),
				conditionImmunities: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				})
			})
		};
	}
}
