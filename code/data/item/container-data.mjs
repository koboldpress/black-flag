import ContainerSheet from "../../applications/item/container-sheet.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import { PhysicalTemplate } from "./templates/_module.mjs";

const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Container items.
 * @mixes PhysicalTemplate
 */
export default class ContainerData extends ItemDataModel.mixin(PhysicalTemplate) {

	static get metadata() {
		return {
			type: "container",
			category: "equipment",
			localization: "BF.Item.Type.Container",
			icon: "fa-solid fa-box-open",
			sheet: {
				application: ContainerSheet,
				label: "BF.Sheet.Default.Container"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			// type: new SchemaField({
			// 	value: new StringField({initial: "melee", label: "BF.Weapon.Type.Label"}),
			// 	category: new StringField({label: "BF.Equipment.Category.Label"}),
			// 	base: new StringField({label: "BF.Equipment.Base.Label"})
			// }),
			properties: new SetField(new StringField(), {
				label: "BF.Property.Label[other]"
			}),
			capacity: new SchemaField({
				count: new NumberField({min: 0, integer: true}),
				volume: new SchemaField({
					value: new NumberField({min: 0}),
					units: new StringField({initial: "foot"}) // Represents cubic feet
				}),
				weight: new SchemaField({
					value: new NumberField({min: 0}),
					units: new StringField({initial: "pound"})
				})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseQuantity() {
		this.quantity = 1;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

}
