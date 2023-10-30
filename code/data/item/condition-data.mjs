import ConditionSheet from "../../applications/item/condition-sheet.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import { IdentifierField } from "../fields/_module.mjs";

const { SchemaField } = foundry.data.fields;

/**
 * Data definition for Condition items.
 */
export default class ConditionData extends ItemDataModel {
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "condition",
			category: "meta",
			localization: "BF.Item.Type.Condition",
			icon: "fa-solid fa-explosion",
			sheet: {
				application: ConditionSheet,
				label: "BF.Sheet.Default.Condition"
			},
			register: {
				cache: true
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			identifier: new SchemaField({
				value: new IdentifierField()
			})
		});
	}
}
