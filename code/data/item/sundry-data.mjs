import ItemDataModel from "../abstract/item-data-model.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Sundry items.
 * @mixes {PhysicalTemplate}
 */
export default class SundryData extends ItemDataModel.mixin(PhysicalTemplate) {

	static get metadata() {
		return {
			type: "sundry",
			category: "equipment",
			localization: "BF.Item.Type.Sundry",
			icon: "fa-solid fa-boxes-stacked"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			type: new SchemaField({
				category: new StringField({label: "BF.Equipment.Category.Label"})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get validCategories() {
		return CONFIG.BlackFlag.sundryCategories;
	}
}
