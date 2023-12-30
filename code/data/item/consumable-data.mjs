import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Consumable items.
 * @mixes {ActivitiesTemplate}
 * @mixes {PhysicalTemplate}
 */
export default class ConsumableData extends ItemDataModel.mixin(ActivitiesTemplate, PhysicalTemplate) {

	static get metadata() {
		return {
			type: "consumable",
			category: "equipment",
			localization: "BF.Item.Type.Consumable",
			icon: "fa-solid fa-bottle-droplet"
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
		return CONFIG.BlackFlag.consumableCategories;
	}
}
