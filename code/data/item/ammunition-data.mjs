import ItemDataModel from "../abstract/item-data-model.mjs";

/**
 * Data definition for Ammunition items.
 */
export default class AmmunitionData extends ItemDataModel {

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
			}),
			price: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({
					nullable: false, initial: 0, min: 0, step: 0.01, label: "BF.Price.Label"
				}),
				denomination: new foundry.data.fields.StringField({
					blank: false, initial: "gp", label: "BF.Currency.Denomination.Label"
				})
			}, {label: "BF.Price.Label"}),
			quantity: new foundry.data.fields.NumberField({
				nullable: false, initial: 1, min: 0, integer: true, label: "BF.Quantity.Label"
			}),
			weight: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({
					nullable: false, initial: 0, min: 0, step: 0.01, label: "BF.Weight.Label"
				}),
				units: new foundry.data.fields.StringField({initial: "pound"})
			}, {label: "BF.Weight.Label"})
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
