import { LocalDocumentField } from "../fields/_module.mjs";

const { ArrayField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Grant Features advancement.
 */
export class GrantFeaturesConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			pool: new ArrayField(new SchemaField({
				uuid: new StringField({blank: false, nullable: false}) // TODO: Replace with UUIDField when available
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
			added: new ArrayField(new SchemaField({
				document: new LocalDocumentField(foundry.documents.BaseItem),
				uuid: new StringField() // TODO: Replace with UUIDField when available
			}), {required: false, initial: undefined})
		};
	}
}
