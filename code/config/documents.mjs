import * as itemSheet from "../applications/item/_module.mjs";
import * as actorTypes from "../data/actor/_module.mjs";
import * as itemTypes from "../data/item/_module.mjs";
import * as journalTypes from "../data/journal/_module.mjs";

/**
 * Categories of documents that appear in the create menu.
 */
export const _documentCategories = {
	Actor: {
		person: {
			label: "BF.Actor.Category.Person.Label",
			types: [actorTypes.PCData, actorTypes.NPCData]
		}
	},
	Item: {
		concept: {
			label: "BF.Item.Category.Concept.Label",
			types: [
				itemTypes.ClassData,
				itemTypes.SubclassData,
				itemTypes.LineageData,
				itemTypes.HeritageData,
				itemTypes.BackgroundData
			],
			sheet: {
				application: itemSheet.ConceptSheet,
				label: "BF.Sheet.Default.Concept"
			}
		},
		feature: {
			label: "BF.Item.Category.Feature.Label",
			types: [itemTypes.FeatureData, itemTypes.TalentData],
			sheet: {
				application: itemSheet.FeatureSheet,
				label: "BF.Sheet.Default.Feature"
			}
		},
		equipment: {
			label: "BF.Item.Category.Equipment.Label",
			types: [
				itemTypes.AmmunitionData,
				itemTypes.ArmorData,
				itemTypes.ConsumableData,
				itemTypes.ContainerData,
				itemTypes.GearData,
				itemTypes.SundryData,
				itemTypes.ToolData,
				itemTypes.WeaponData
			],
			sheet: {
				application: itemSheet.EquipmentSheet,
				label: "BF.Sheet.Default.Equipment"
			}
		},
		meta: {
			label: "BF.Item.Category.Meta.Label",
			types: [itemTypes.CurrencyData, itemTypes.SpellData]
		}
	},
	JournalEntryPage: {
		summaries: {
			types: [journalTypes.ClassJournalPageData, journalTypes.SubclassJournalPageData, journalTypes.RuleJournalPageData]
		}
	}
};
