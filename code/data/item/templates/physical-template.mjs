import { numberFormat } from "../../../utils/_module.mjs";

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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this item currently equipped?
	 * @type {boolean}
	 */
	get equipped() {
		return this.parent.flags["black-flag"]?.relationship?.equipped ?? false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedTotals() {
		this.price.total = this.price.value * this.quantity;
		this.weight.total = this.weight.value * this.quantity;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedLabels() {
		Object.defineProperty(this.price, "label", {
			get() {
				if ( !this.total ) return "—";
				const denominationConfig = CONFIG.BlackFlag.currencies[this.denomination];
				return game.i18n.format("BF.Currency.Display", {
					value: numberFormat(this.total), denomination: game.i18n.localize(denominationConfig.abbreviation)
				});
				// TODO: Adjust total displayed to use smallest logical units (so 5 cp x 20 = 100 cp => 1 gp)
			},
			configurable: true,
			enumerable: false
		});
		Object.defineProperty(this.weight, "label", {
			get() {
				if ( !this.value ) return "—";
				return numberFormat(this.total, { unit: this.units });
			},
			configurable: true,
			enumerable: false
		});
	}
}
