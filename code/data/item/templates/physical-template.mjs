/**
 * Data definition template for Physical items.
 */
export default class PhysicalTemplate extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
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
		};
	}
}
