import PCSheet from "../../applications/actor/pc-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import * as fields from "../fields/_module.mjs";

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
			abilities: new fields.MappingField(new foundry.data.fields.SchemaField({
				base: new foundry.data.fields.NumberField({min: 0, integer: true}),
				max: new foundry.data.fields.NumberField({min: 0, initial: 20, integer: true}),
				saveProficiency: new foundry.data.fields.SchemaField({
					multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 1, step: 0.5})
				})
				// Bonuses?
				// Minimums?
			}), {
				initialKeys: CONFIG.BlackFlag.abilities, prepareKeys: true
			}),
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
				skills: new fields.MappingField(new foundry.data.fields.SchemaField({
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 1, step: 0.5})
					})
					// Bonuses?
					// Minimum?
				}), {
					initialKeys: CONFIG.BlackFlag.skills, prepareKeys: true
				}),
				tools: new fields.MappingField(new foundry.data.fields.SchemaField({
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
				abilities: new foundry.data.fields.SchemaField({
					method: new foundry.data.fields.StringField(),
					rolls: new foundry.data.fields.ArrayField(new fields.RollField()),
					assignments: new fields.MappingField(new foundry.data.fields.NumberField({min: 0, integer: true})),
					bonuses: new fields.MappingField(new foundry.data.fields.NumberField({integer: true}))
				}),
				// TODO: Rather than ObjectField, this type should be based on advancement data being stored
				advancement: new fields.MappingField(new foundry.data.fields.ObjectField()),
				background: new fields.RegisteredDocumentField("background"),
				heritage: new fields.RegisteredDocumentField("heritage"),
				lineage: new fields.RegisteredDocumentField("lineage"),
				levels: new fields.MappingField(new foundry.data.fields.SchemaField({
					class: new fields.RegisteredDocumentField("class"),
					time: new fields.TimeField()
				})),
				xp: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, integer: true}),
					log: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
						amount: new foundry.data.fields.NumberField({nullable: false, initial: 0, min: 0, integer: true}),
						time: new fields.TimeField(),
						source: new foundry.data.fields.StringField()
					}))
				})
			}),
			// Rolls (contains bonuses, minimums, ability overrides, etc.)?
			// Spellcasting
			traits: new foundry.data.fields.SchemaField({
				movement: new foundry.data.fields.SchemaField({
					base: new foundry.data.fields.NumberField({nullable: false, initial: 30, min: 0, step: 0.1}),
					types: new fields.MappingField(new fields.FormulaField({deterministic: true})),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
					// Units?
					// Multiplier
				}),
				senses: new foundry.data.fields.SchemaField({
					types: new fields.MappingField(new fields.FormulaField({deterministic: true})),
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
				// TODO: Perhaps condition immunities could just be stored with damage immunities
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*  Data Preparation                   */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseData() {
		this.attributes.proficiency = Proficiency.calculateMod(this.progression.level ?? 1);
		for ( const [key, ability] of Object.entries(this.abilities) ) {
			const config = CONFIG.BlackFlag.abilities[key];
			ability.labels = config.labels;
			ability.value = ability.base;
			ability.mod = ability.value ? Math.floor((ability.value - 10) / 2) : null;
		}
		for ( const [key, skill] of Object.entries(this.proficiencies.skills) ) {
			const config = CONFIG.BlackFlag.skills[key];
			skill.label = config.label;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedData() {
	}
}
