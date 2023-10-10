import ClassPageSheet from "../../applications/journal/class-page-sheet.mjs";

/**
 * Data definition for Class Summary journal entry pages.
 */
export default class ClassJournalPageData extends foundry.abstract.DataModel {

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
			item: new foundry.data.fields.StringField({label: "BF.JournalPage.Class.Item"}),
			description: new foundry.data.fields.SchemaField({
				introduction: new foundry.data.fields.HTMLField({
					label: "BF.JournalPage.Class.Introduction.Label", hint: "BF.JournalPage.Class.Introduction.Hint"
				}),
				additionalHitPoints: new foundry.data.fields.HTMLField({
					label: "BF.HitPoint.Label[other]", hint: "BF.JournalPage.Class.HitPoints.Hint"
				}),
				additionalTraits: new foundry.data.fields.HTMLField({
					label: "BF.Proficiency.Label[other]", hint: "BF.JournalPage.Class.Traits.Hint"
				}),
				additionalEquipment: new foundry.data.fields.HTMLField({
					label: "BF.JournalPage.Class.Equipment.Header", hint: "BF.JournalPage.Class.Equipment.Hint"
				})
			})
		};
	}
}
