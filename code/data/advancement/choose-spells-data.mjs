import { LocalDocumentField, MappingField } from "../fields/_module.mjs";
import { SpellConfigurationData } from "./grant-spells-data.mjs";

const { ArrayField, BooleanField, EmbeddedDataField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Choose Spells advancement.
 *
 * @property {boolean} allowDrops - Allow player to drop spells not in the pool.
 * @property {Record<number, number>} choices - Choices presented at each level.
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
export class ChooseSpellsConfigurationData extends foundry.abstract.DataModel {
	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement.ChooseFeatures", "BF.Advancement.ChooseSpells"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			allowDrops: new BooleanField({
				initial: true,
				label: "BF.Advancement.Config.AllowDrops.Label",
				hint: "BF.Advancement.Config.AllowDrops.Hint"
			}),
			choices: new MappingField(new NumberField({ min: 1, integer: true }), {
				label: "BF.Advancement.ChooseFeatures.Choices.Label",
				hint: "BF.Advancement.ChooseFeatures.Choices.Hint"
			}),
			pool: new ArrayField(
				new SchemaField({
					uuid: new StringField({ blank: false, nullable: false })
				}),
				{ label: "DOCUMENT.Items" }
			),
			restriction: new SchemaField({
				allowCantrips: new BooleanField(),
				allowRituals: new StringField(),
				circle: new NumberField({ initial: -1, label: "BF.Spell.Circle.Label" }),
				exactCircle: new BooleanField({ initial: true }),
				source: new StringField({ label: "BF.Spell.Source.Label" })
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
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Choose Spells advancement.
 *
 * @property {string} ability - Ability to assign if applicable.
 * @property {Record<number, GrantedSpellData[]>} added - Spells chosen at each level.
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
						uuid: new StringField() // TODO: Replace with UUIDField when available
					})
				),
				{ required: false, initial: undefined }
			)
		};
	}
}
