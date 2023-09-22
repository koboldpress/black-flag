import * as fields from "../fields/_module.mjs";

/**
 * Configuration data for the Grant Features advancement.
 */
export class GrantFeaturesConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			pool: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
				uuid: new foundry.data.fields.StringField({blank: false, nullable: false})
			}), { label: "DOCUMENT.Items" })
		};
	}
}

/**
 * Value data for the Grant Features advancement.
 */
export class GrantFeaturesValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			added: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
				document: new fields.LocalDocumentField(foundry.documents.BaseItem),
				uuid: new foundry.data.fields.StringField()
			}), {required: false, initial: undefined})
		};
	}
}
