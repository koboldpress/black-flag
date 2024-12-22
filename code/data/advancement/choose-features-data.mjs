import AdvancementDataModel from "../abstract/advancement-data-model.mjs";
import { LocalDocumentField, MappingField } from "../fields/_module.mjs";

const { ArrayField, BooleanField, DocumentIdField, DocumentUUIDField, NumberField, SchemaField, StringField } =
	foundry.data.fields;

/**
 * Configuration data for choice levels.
 *
 * @typedef {object} ChoiceLevelConfiguration
 * @property {number} count         Number of items a player can select at this level.
 * @property {boolean} replacement  Can a player replace previous selections at this level?
 */

/**
 * Configuration data for the Choose Features advancement.
 *
 * @property {boolean} allowDrops - Allow player to drop items not in the pool.
 * @property {Record<number, ChoiceLevelConfiguration>} choices - Choices presented at each level.
 * @property {FeatureGrantConfiguration[]} pool - Items to present as choices.
 * @property {object} restriction
 * @property {string} restriction.category - Category of allowed items (e.g. class or race).
 * @property {string} restriction.type - Subtype of allowed items (e.g. martialTalent or channelDivinity).
 * @property {string} type - General item type to support (e.g. feature or talent).
 */
export class ChooseFeaturesConfigurationData extends AdvancementDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement.ChooseFeatures"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			allowDrops: new BooleanField({ initial: true }),
			choices: new MappingField(
				new SchemaField({
					count: new NumberField({ min: 1, integer: true }),
					replacement: new BooleanField()
				})
			),
			pool: new ArrayField(new SchemaField({ uuid: new DocumentUUIDField() })),
			restriction: new SchemaField({
				category: new StringField(),
				type: new StringField()
			}),
			type: new StringField({ blank: false, initial: "feature" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		// Added in 0.10.051
		if ("choices" in source)
			Object.entries(source.choices).forEach(([k, c]) => {
				if (foundry.utils.getType(c) === "number") source.choices[k] = { count: c };
			});
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for replaced features.
 *
 * @typedef {object} ReplacedFeatureData
 * @property {number} level - Level that feature that was replaced was originally added.
 * @property {string} original - ID of the original feature to be replaced.
 * @property {string} replacement - ID of the replacing feature.
 */

/**
 * Value data for the Choose Features advancement.
 *
 * @property {Record<number, GrantedFeatureData[]>} added - Features chosen at each level.
 * @property {Record<number, ReplacedFeatureData>} replaced - Information on items replaced at each level.
 */
export class ChooseFeaturesValueData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			added: new MappingField(
				new ArrayField(
					new SchemaField({
						document: new LocalDocumentField(foundry.documents.BaseItem),
						uuid: new DocumentUUIDField()
					})
				),
				{ required: false, initial: undefined }
			),
			replaced: new MappingField(
				new SchemaField({
					level: new NumberField({ integer: true, min: 0 }),
					original: new DocumentIdField(),
					replacement: new DocumentIdField()
				})
			)
		};
	}
}
