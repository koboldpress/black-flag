import ClassPageSheet from "../../applications/journal/class-page-sheet.mjs";
import BaseDataModel from "../abstract/base-data-model.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Class Summary journal entry pages.
 */
export default class ClassJournalPageData extends BaseDataModel {

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

	static defineSchema() {
		return {
			item: new StringField({label: "BF.JournalPage.Class.Item"}),
			description: new SchemaField({
				introduction: new HTMLField({
					label: "BF.JournalPage.Class.Introduction.Label", hint: "BF.JournalPage.Class.Introduction.Hint"
				}),
				additionalHitPoints: new HTMLField({
					label: "BF.HitPoint.Label[other]", hint: "BF.JournalPage.Class.HitPoints.Hint"
				}),
				additionalTraits: new HTMLField({
					label: "BF.Proficiency.Label[other]", hint: "BF.JournalPage.Class.Traits.Hint"
				}),
				additionalEquipment: new HTMLField({
					label: "BF.JournalPage.Class.Equipment.Header", hint: "BF.JournalPage.Class.Equipment.Hint"
				})
			})
		};
	}
}
