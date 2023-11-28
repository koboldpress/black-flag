import ActorDataModel from "../abstract/actor-data-model.mjs";
import { MappingField, ProficiencyField } from "../fields/_module.mjs";
import ACTemplate from "./templates/ac-template.mjs";
import ModifiersTemplate from "./templates/modifiers-template.mjs";
import TraitsTemplate from "./templates/traits-template.mjs";

const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class NPCData extends ActorDataModel.mixin(ACTemplate, ModifiersTemplate, TraitsTemplate) {

	static metadata = {
		type: "npc",
		category: "person",
		localization: "BF.Actor.Type.NPC"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			abilities: new MappingField(new SchemaField({
				mod: new NumberField({integer: true}),
				save: new SchemaField({
					proficiency: new ProficiencyField({rounding: false})
				})
			}), {
				initialKeys: CONFIG.BlackFlag.abilities, prepareKeys: true, label: "BF.Ability.Label[other]"
			}),
			attributes: new SchemaField({
				cr: new NumberField({nullable: false, min: 0, initial: 0, label: "BF.ChallengeRating.Label"}),
				hp: new SchemaField({
					value: new NumberField({min: 0, integer: true, label: "BF.HitPoint.Current.LabelLong"}),
					temp: new NumberField({min: 0, integer: true, label: "BF.HitPoint.Temp.LabelLong"})
					// TODO: HP Formula
				}, {label: "BF.HitPoint.Label[other]"}),
				initiative: new SchemaField({
					lair: new NumberField({integer: true})
				}),
				legendary: new SchemaField({
					spent: new NumberField({min: 0, initial: 0, integer: true}),
					max: new NumberField({min: 1, initial: null, integer: true})
				})
			}),
			biography: new SchemaField({
				value: new HTMLField(),
				lair: new HTMLField(),
				legendary: new HTMLField(),
				source: new StringField()
			}),
			proficiencies: new SchemaField({
				languages: new SchemaField({
					value: new SetField(new StringField()),
					tags: new SetField(new StringField())
				}),
				skills: new MappingField(new SchemaField({
					proficiency: new ProficiencyField({rounding: false})
				}), {
					initialKeys: CONFIG.BlackFlag.skills, prepareKeys: true, label: "BF.Skill.Label[other]"
				}),
				tools: new MappingField(new SchemaField({
					proficiency: new ProficiencyField({rounding: false})
				}), {label: "BF.Tool.Label[other]"})
			})
		});
	}
}
