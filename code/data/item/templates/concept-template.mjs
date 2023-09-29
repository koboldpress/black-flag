import ConceptSheet from "../../../applications/item/concept-sheet.mjs";
import * as fields from "../../fields/_module.mjs";
import AdvancementTemplate from "./advancement-template.mjs";

/**
 * Data definition template for Concept items (class, background, lineage, heritage).
 */
export default class ConceptTemplate extends AdvancementTemplate {

	static get metadata() {
		return {
			register: {
				cache: true
			},
			sheet: {
				application: ConceptSheet,
				label: "BF.Sheet.Concept"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			color: new foundry.data.fields.ColorField(),
			advancement: new fields.AdvancementField(),
			description: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				journal: new foundry.data.fields.StringField({label: "BF.Item.Journal.Label", hint: "BF.Item.Journal.Hint"}),
				source: new foundry.data.fields.StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			identifier: new foundry.data.fields.SchemaField({
				value: new fields.IdentifierField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of the traits to display on the item sheet.
	 * @type {object[]}
	 * @abstract
	 */
	get traits() {
		return [];
	}
}
