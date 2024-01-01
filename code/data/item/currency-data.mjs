import CurrencySheet from "../../applications/item/currency-sheet.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import IdentifierField from "../fields/identifier-field.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Currency items.
 * @mixes {PhysicalTemplate}
 */
export default class CurrencyData extends ItemDataModel.mixin(PhysicalTemplate) {

	static get metadata() {
		return {
			type: "currency",
			category: "meta",
			localization: "BF.Item.Type.Currency",
			icon: "fa-solid fa-boxes-stacked",
			register: {
				cache: true
			},
			sheet: {
				application: CurrencySheet,
				label: "BF.Sheet.Default.Currency"
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
			price: false,
			weight: new SchemaField({
				value: new NumberField({initial: 0.32}),
				units: new StringField({initial: "ounce"})
			}, {label: "BF.Weight.Label"}),
			identifier: new SchemaField({
				value: new IdentifierField()
			}),
			conversion: new SchemaField({
				value: new NumberField({
					initial: 1, positive: true, label: "BF.Currency.ConversionRatio.Label",
					hint: "BF.Currency.ConversionRatio.Hint"
				})
			})
		});
	}
}
