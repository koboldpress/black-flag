import AdvancementDataModel from "../abstract/advancement-data-model.mjs";
import LocalDocumentField from "../fields/local-document-field.mjs";

const { ArrayField, BooleanField, DocumentUUIDField, SchemaField } = foundry.data.fields;

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
export class GrantFeaturesConfigurationData extends AdvancementDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement.GrantFeatures"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			enabled: new BooleanField({ initial: true }),
			pool: new ArrayField(new SchemaField({ uuid: new DocumentUUIDField() }))
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
					uuid: new DocumentUUIDField()
				}),
				{ required: false, initial: undefined }
			)
		};
	}
}
