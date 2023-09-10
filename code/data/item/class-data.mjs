import ClassSheet from "../../applications/item/class-sheet.mjs";
import * as fields from "../fields/_module.mjs";

/**
 * Data definition for Class items.
 * @property {object} description
 * @property {string} description.value - Short description of this class.
 * @property {string} description.journal - UUID of a journal entry with an extended class description.
 * @property {string} description.source - Source book or module where this item originated.
 * @property {string} description.color - Color associated with this class.
 * @property {object} identifier
 * @property {string} identifier.value - Class's identifier.
 */
export default class ClassData extends foundry.abstract.TypeDataModel {

	static get metadata() {
		return {
			type: "class",
			localization: "BF.Item.Type.Class",
			register: true,
			sheet: {
				application: ClassSheet,
				label: "BF.Sheet.Concept"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			description: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				journal: new foundry.data.fields.StringField({label: "BF.Item.Journal.Label", hint: "BF.Item.Journal.Hint"}),
				source: new foundry.data.fields.StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"}),
				color: new foundry.data.fields.ColorField()
			}),
			identifier: new foundry.data.fields.SchemaField({
				value: new fields.IdentifierField()
			})
		};
	}
}
