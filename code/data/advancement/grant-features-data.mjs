import { LocalDocumentField } from "../fields/_module.mjs";

const { ArrayField, BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for an individual item entry in grant features.
 *
 * @typedef {object} FeatureGrantConfiguration
 * @property {string} uuid - UUID of the item to grant.
 */

/**
 * Configuration data for the Grant Features advancement.
 *
 * @property {boolean} enabled - Should the features be enabled by default when added?
 * @property {FeatureGrantConfiguration[]} pool - Items to grant.
 */
export class GrantFeaturesConfigurationData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			enabled: new BooleanField({ initial: true }),
			pool: new ArrayField(
				new SchemaField({
					uuid: new StringField({ blank: false, nullable: false }) // TODO: Replace with UUIDField when available
				}),
				{ label: "DOCUMENT.Items" }
			)
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for granted features.
 *
 * @typedef {object} GrantedFeatureData
 * @property {string} document - Linked document on the actor.
 * @property {string} uuid - Source UUID for the original document.
 */

/**
 * Value data for the Grant Features advancement.
 *
 * @property {GrantedFeatureData[]} added - Features added.
 */
export class GrantFeaturesValueData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			added: new ArrayField(
				new SchemaField({
					document: new LocalDocumentField(foundry.documents.BaseItem),
					uuid: new StringField() // TODO: Replace with UUIDField when available
				}),
				{ required: false, initial: undefined }
			)
		};
	}
}
