import ClassPageSheet from "../../applications/journal/class-page-sheet.mjs";
import BaseDataModel from "../abstract/base-data-model.mjs";

const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Class Summary journal entry pages.
 *
 * @property {string} item - UUID of the referenced class item.
 * @property {number} headingLevel - Override the level of included headers.
 * @property {object} description
 * @property {string} description.introduction - Introductory description for the class.
 * @property {string} description.additionalHitPoints - Additional text displayed beneath the hit points section.
 * @property {string} description.additionalTraits - Additional text displayed beneath the traits section.
 * @property {string} description.additionalEquipment - Additional text displayed beneath the equipment section.
 * @property {string} description.subclassAdvancement - Subclass description as it appears in the features list.
 * @property {string} description.subclassSection - Subclass description as it appears before the list of subclasses.
 * @property {Set<string>} subclasses - UUIDs of subclasses to display on the class page.
 */
export default class ClassJournalPageData extends BaseDataModel {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "class",
			localization: "BF.JournalPage.Type.Class",
			sheet: {
				application: ClassPageSheet,
				label: "BF.Sheet.Default.ClassPage"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			item: new StringField({ label: "BF.JournalPage.Class.Item" }),
			// TODO: Replace with UUIDField when possible
			headingLevel: new NumberField({ initial: 3 }),
			description: new SchemaField({
				introduction: new HTMLField({
					label: "BF.JournalPage.Class.Introduction.Label",
					hint: "BF.JournalPage.Class.Introduction.Hint"
				}),
				additionalHitPoints: new HTMLField({
					label: "BF.HitPoint.Label[other]",
					hint: "BF.JournalPage.Class.HitPoints.Hint"
				}),
				additionalTraits: new HTMLField({
					label: "BF.Proficiency.Label[other]",
					hint: "BF.JournalPage.Class.Traits.Hint"
				}),
				additionalEquipment: new HTMLField({
					label: "BF.JournalPage.Class.Equipment.Header",
					hint: "BF.JournalPage.Class.Equipment.Hint"
				}),
				subclassAdvancement: new HTMLField({
					label: "BF.JournalPage.Class.Subclass.AdvancementDescription.Label",
					hint: "BF.JournalPage.Class.Subclass.AdvancementDescription.Hint"
				}),
				subclassSection: new HTMLField({
					label: "BF.JournalPage.Class.Subclass.SectionDescription.Label",
					hint: "BF.JournalPage.Class.Subclass.SectionDescription.Hint"
				})
			}),
			subclasses: new SetField(new StringField(), { label: "BF.JournalPage.Class.Subclass.Items" })
			// TODO: Replace with UUIDField when possible
		};
	}
}
