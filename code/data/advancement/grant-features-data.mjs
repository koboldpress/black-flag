/**
 * Configuration data for the Grant Features advancement.
 *
 * @property {string[]} pool - Array of item UUIDs that will be granted.
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
 *
 * @property {{[key: string]: {document: BlackFlagItem, uuid: string}}} added - IDs of the granted items on the actor
 *                                                                              and their origin UUID.
 */
export class GrantFeaturesValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			added: new ArrayField(new foundry.data.fields.SchemaField({
				document: new fields.LocalDocumentField(foundry.documents.BaseItem),
				uuid: new foundry.data.fields.StringField()
			}), {required: false, initial: undefined})
		};
	}
}
