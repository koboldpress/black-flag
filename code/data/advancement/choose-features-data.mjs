import { LocalDocumentField, MappingField } from "../fields/_module.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

export class ChooseFeaturesConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			hint: new StringField({
				label: "BF.Advancement.Core.Hint.Label", hint: "BF.Advancement.Core.Hint.Hint"
			}),
			choices: new MappingField(new NumberField({min: 1, integer: true}), {
				label: "BF.Advancement.ChooseFeatures.Choices.Label", hint: "BF.Advancement.ChooseFeatures.Choices.Hint"
			}),
			allowDrops: new BooleanField({
				initial: true, label: "BF.Advancement.Config.AllowDrops.Label",
				hint: "BF.Advancement.Config.AllowDrops.Hint"
			}),
			type: new StringField({
				blank: false, initial: "feature", label: "BF.Advancement.ChooseFeatures.Type.Label"
			}),
			pool: new ArrayField(new SchemaField({
				uuid: new StringField({blank: false, nullable: false})
			}), { label: "DOCUMENT.Items" }),
			restriction: new SchemaField({
				category: new StringField({label: "BF.Item.Feature.Category.Label"}),
				type: new StringField({label: "BF.Item.Feature.Type.Label"})
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
			added: new MappingField(new ArrayField(new SchemaField({
				document: new LocalDocumentField(foundry.documents.BaseItem),
				uuid: new StringField()
			})), {required: false, initial: undefined})
		};
	}
}
