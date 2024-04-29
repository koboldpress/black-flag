import { LocalDocumentField, MappingField } from "../fields/_module.mjs";
import { SpellConfigurationData } from "./grant-spells-data.mjs";

const { ArrayField, BooleanField, EmbeddedDataField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Choose Spells advancement.
 *
 * @property {Record<number, number>} choices - Choices presented at each level.
 * @property {boolean} allowDrops - Allow player to drop spells not in the pool.
 * @property {FeatureGrantConfiguration[]} pool - Spells to present as choices.
 * @property {object} restriction
 * @property {boolean} restriction.allowCantrips - Allow cantrips to be selected if "Any Circle" is set.
 * @property {boolean} restriction.allowRituals - Allow rituals to be selected.
 * @property {number} restriction.circle - Circle allowed for choosing spells or `-1` to represent any circle
 *                                         available to the character.
 * @property {string} restriction.source - Source of magic required for to select spells.
 * @property {SpellConfigurationData} spell - Configuration data for granted spells.
 */
export class ChooseSpellsConfigurationData extends foundry.abstract.DataModel {
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
			pool: new ArrayField(
				new SchemaField({
					uuid: new StringField({ blank: false, nullable: false })
				}),
				{ label: "DOCUMENT.Items" }
			),
			restriction: new SchemaField({
				allowCantrips: new BooleanField({ label: "BF.Advancement.ChooseSpells.AllowCantrips" }),
				allowRituals: new BooleanField({ label: "BF.Advancement.ChooseSpells.AllowRituals" }),
				circle: new NumberField({ initial: -1, label: "BF.Spell.Circle.Label" }),
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
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Choose Spells advancement.
 *
 * @property {Record<number, GrantedSpellData[]>} added - Spells chosen at each level.
 */
export class ChooseSpellsValueData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
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
