import ItemDataModel from "../abstract/item-data-model.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

/**
 * Data definition for Ammunition items.
 * @mixes PhysicalTemplate
 */
export default class AmmunitionData extends ItemDataModel.mixin(PhysicalTemplate) {

	static get metadata() {
		return {
			type: "ammunition",
			category: "equipment",
			localization: "BF.Item.Type.Ammunition",
			icon: "fa-solid fa-lines-leaning"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new foundry.data.fields.StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			type: new foundry.data.fields.SchemaField({
				category: new foundry.data.fields.StringField({label: "BF.Equipment.Category.Label"})
			})
			// TODO: Properties (magical?, adamantine?, silvered?)
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
