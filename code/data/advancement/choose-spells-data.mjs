import AdvancementDataModel from "../abstract/advancement-data-model.mjs";
import { LocalDocumentField, MappingField } from "../fields/_module.mjs";
import { SpellConfigurationData } from "./grant-spells-data.mjs";

const {
	ArrayField,
	BooleanField,
	DocumentIdField,
	DocumentUUIDField,
	EmbeddedDataField,
	NumberField,
	SchemaField,
	StringField
} = foundry.data.fields;

/**
 * Configuration data for the Choose Spells advancement.
 *
 * @property {boolean} allowDrops - Allow player to drop spells not in the pool.
 * @property {Record<number, ChoiceLevelConfiguration>} choices - Choices presented at each level.
 * @property {FeatureGrantConfiguration[]} pool - Spells to present as choices.
 * @property {object} restriction
 * @property {boolean} restriction.allowCantrips - Allow cantrips to be selected if "Any Circle" is set.
 * @property {boolean} restriction.allowRituals - Allow rituals to be selected.
 * @property {number} restriction.circle - Circle allowed for choosing spells or `-1` to represent any circle
 *                                         available to the character.
 * @property {boolean} restriction.exactCircle - Does the circle need to be exact, or are lower circle spells allowed?
 * @property {string} restriction.source - Source of magic required for to select spells.
 * @property {SpellConfigurationData} spell - Configuration data for granted spells.
 */
export class ChooseSpellsConfigurationData extends AdvancementDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = [
		...super.LOCALIZATION_PREFIXES,
		"BF.Advancement.SpellConfig",
		"BF.Advancement.ChooseSpells"
	];

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
				allowCantrips: new BooleanField(),
				allowRituals: new StringField(),
				circle: new NumberField({ initial: -1 }),
				exactCircle: new BooleanField({ initial: true }),
				source: new StringField()
			}),
			spell: new EmbeddedDataField(SpellConfigurationData)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item type that can be chosen.
	 * @type {string}
	 */
	get type() {
		return "spell";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		// Added in 0.9.037
		if (foundry.utils.getType(source.restriciton?.allowRituals) === "boolean") {
			source.restriction.allowRituals = source.restriction.allowRituals ? "allow" : "";
		}

		// Added in 0.10.051
		if ("choices" in source)
			Object.entries(source.choices).forEach(([k, c]) => {
				if (foundry.utils.getType(c) === "number") source.choices[k] = { count: c };
			});
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Choose Spells advancement.
 *
 * @property {string} ability - Ability to assign if applicable.
 * @property {Record<number, GrantedSpellData[]>} added - Spells chosen at each level.
 * @property {Record<number, ReplacedFeatureData>} replaced - Information on items replaced at each level.
 */
export class ChooseSpellsValueData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new StringField(),
			added: new MappingField(
				new ArrayField(
					new SchemaField({
						document: new LocalDocumentField(foundry.documents.BaseItem),
						modified: new BooleanField(),
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
