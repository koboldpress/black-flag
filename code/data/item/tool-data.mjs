import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Tool items.
 * @mixes {ActivitiesTemplate}
 * @mixes {PhysicalTemplate}
 */
export default class ToolData extends ItemDataModel.mixin(ActivitiesTemplate, PhysicalTemplate) {

	static get metadata() {
		return {
			type: "tool",
			category: "equipment",
			localization: "BF.Item.Type.Tool",
			icon: "fa-solid fa-screwdriver-wrench",
			img: "systems/black-flag/artwork/types/tool.svg"
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
				category: new StringField({label: "BF.Equipment.Category.Label"}),
				base: new StringField({label: "BF.Equipment.Base.Label"})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get validCategories() {
		return CONFIG.BlackFlag.tools;
	}
}