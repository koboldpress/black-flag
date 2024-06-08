import ClassPageSheet from "../../applications/journal/class-page-sheet.mjs";
import BaseDataModel from "../abstract/base-data-model.mjs";

const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Subclass Summary journal entry pages.
 *
 * @property {string} item - UUID of the referenced subclass item.
 * @property {number} headingLevel - Override the level of included headers.
 * @property {object} description
 * @property {string} description.introduction - Introductory description for the subclass.
 */
export default class SubclassJournalPageData extends BaseDataModel {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "subclass",
			localization: "BF.JournalPage.Type.Subclass",
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
			item: new StringField({ label: "BF.JournalPage.Subclass.Item" }),
			// TODO: Replace with UUIDField when possible
			headingLevel: new NumberField({ initial: 4 }),
			description: new SchemaField({
				introduction: new HTMLField({
					label: "BF.JournalPage.Class.Introduction.Label",
					hint: "BF.JournalPage.Subclass.Introduction.Hint"
				})
			})
		};
	}
}
