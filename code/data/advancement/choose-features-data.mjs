import { LocalDocumentField, MappingField } from "../fields/_module.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Choose Features advancement.
 *
 * @property {Record<number, number>} choices - Choices presented at each level.
 * @property {boolean} allowDrops - Allow player to drop items not in the pool.
 * @property {string} type - General item type to support (e.g. feature or talent).
 * @property {FeatureGrantConfiguration[]} pool - Items to present as choices.
 * @property {object} restriction
 * @property {string} restriction.category - Category of allowed items (e.g. class or race).
 * @property {string} restriction.type - Subtype of allowed items (e.g. martialTalent or channelDivinity).
 */
export class ChooseFeaturesConfigurationData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			choices: new MappingField(new NumberField({ min: 1, integer: true }), {
				label: "BF.Advancement.ChooseFeatures.Choices.Label",
				hint: "BF.Advancement.ChooseFeatures.Choices.Hint"
			}),
			allowDrops: new BooleanField({
				initial: true,
				label: "BF.Advancement.Config.AllowDrops.Label",
				hint: "BF.Advancement.Config.AllowDrops.Hint"
			}),
			type: new StringField({
				blank: false,
				initial: "feature",
				label: "BF.Advancement.ChooseFeatures.Type.Label"
			}),
			pool: new ArrayField(
				new SchemaField({
					uuid: new StringField({ blank: false, nullable: false })
				}),
				{ label: "DOCUMENT.Items" }
			),
			restriction: new SchemaField({
				category: new StringField({ label: "BF.Feature.Category.Label" }),
				type: new StringField({ label: "BF.Feature.Type.Label" })
			})
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Choose Features advancement.
 *
 * @property {Record<number, GrantedFeatureData[]>} added - Features chosen at each level.
 */
export class ChooseFeaturesValueData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			added: new MappingField(
				new ArrayField(
					new SchemaField({
						document: new LocalDocumentField(foundry.documents.BaseItem),
						uuid: new StringField() // TODO: Replace with UUIDField when available
					})
				),
				{ required: false, initial: undefined }
			)
		};
	}
}
