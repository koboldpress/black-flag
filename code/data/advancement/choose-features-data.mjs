import * as fields from "../fields/_module.mjs";

export class ChooseFeaturesConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			hint: new foundry.data.fields.StringField({
				label: "BF.Advancement.Core.Hint.Label", hint: "BF.Advancement.Core.Hint.Hint"
			}),
			choices: new fields.MappingField(new foundry.data.fields.NumberField({min: 1, integer: true}), {
				label: "BF.Advancement.ChooseFeatures.Choices.Label", hint: "BF.Advancement.ChooseFeatures.Choices.Hint"
			}),
			allowDrops: new foundry.data.fields.BooleanField({
				initial: true, label: "BF.Advancement.Config.AllowDrops.Label",
				hint: "BF.Advancement.Config.AllowDrops.Hint"
			}),
			type: new foundry.data.fields.StringField({
				blank: false, initial: "feature", label: "BF.Advancement.ChooseFeatures.Type.Label"
			}),
			pool: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
				uuid: new foundry.data.fields.StringField({blank: false, nullable: false})
			}), { label: "DOCUMENT.Items" }),
			restriction: new foundry.data.fields.SchemaField({
				category: new foundry.data.fields.StringField({label: "BF.Item.Feature.Category.Label"}),
				type: new foundry.data.fields.StringField({label: "BF.Item.Feature.Type.Label"})
			})
		};
	}
}

/**
 * Value data for the Choose Features advancement.
 */
export class ChooseFeaturesValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			added: new fields.MappingField(new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
				document: new fields.LocalDocumentField(foundry.documents.BaseItem),
				uuid: new foundry.data.fields.StringField()
			})), {required: false, initial: undefined})
		};
	}
}
