import ItemDataModel from "../abstract/item-data-model.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Ammunition items.
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 */
export default class AmmunitionData extends ItemDataModel.mixin(PhysicalTemplate, PropertiesTemplate) {

	static get metadata() {
		return {
			type: "ammunition",
			category: "equipment",
			localization: "BF.Item.Type.Ammunition",
			icon: "fa-solid fa-lines-leaning",
			img: "systems/black-flag/artwork/types/ammunition.svg"
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
			// TODO: Damage bonuses
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get validCategories() {
		return CONFIG.BlackFlag.ammunition;
	}
}
