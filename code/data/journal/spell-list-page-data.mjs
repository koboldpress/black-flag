import SpellListPageSheet from "../../applications/journal/spell-list-page-sheet.mjs";
import BaseDataModel from "../abstract/base-data-model.mjs";

const { HTMLField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data model for spell list data.
 *
 * @property {object} description
 * @property {string} description.conclusion    Description to display after spell list.
 * @property {string} description.introduction  Description to display before spell list.
 * @property {string} grouping                  Default grouping mode.
 * @property {Set<string>} spells               UUIDs of spells to display.
 */
export default class SpellListJournalPageData extends BaseDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.SPELLLIST"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get metadata() {
		return {
			type: "spells",
			localization: "BF.JournalPage.Type.SpellList",
			sheet: {
				application: SpellListPageSheet,
				label: "BF.Sheet.Default.SpellListPage"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static defineSchema() {
		return {
			description: new SchemaField({
				conclusion: new HTMLField({ textSearch: true }),
				introduction: new HTMLField({ textSearch: true })
			}),
			grouping: new StringField({ initial: "circle", choices: this.GROUPING_MODES }),
			spells: new SetField(new StringField())
		};
	}

	/* -------------------------------------------- */

	/**
	 * Different ways in which spells can be grouped on the sheet.
	 * @enum {string}
	 */
	static GROUPING_MODES = {
		none: "BF.SPELLLIST.Grouping.None",
		alphabetical: "BF.SPELLLIST.Grouping.Alphabetical",
		circle: "BF.SPELLLIST.Grouping.Circle",
		school: "BF.SPELLLIST.Grouping.School"
	};
}
