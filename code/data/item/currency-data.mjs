import CurrencySheet from "../../applications/item/currency-sheet.mjs";
import { numberFormat } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import IdentifierField from "../fields/identifier-field.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Currency items.
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 *
 * @property {object} identifier
 * @property {string} identifier.value - Unique identifier for this currency.
 * @property {object} conversion
 * @property {number} conversion.value - Rate at which this currency is converted into a standard baseline.
 */
export default class CurrencyData extends ItemDataModel.mixin(DescriptionTemplate, PhysicalTemplate) {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "currency",
			category: "meta",
			localization: "BF.Item.Type.Currency",
			icon: "fa-solid fa-boxes-stacked",
			img: "systems/black-flag/artwork/types/currency.svg",
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

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			price: false,
			weight: new SchemaField(
				{
					value: new NumberField({ initial: 0.32 }),
					units: new StringField({ initial: "ounce" })
				},
				{ label: "BF.Weight.Label" }
			),
			identifier: new SchemaField({
				value: new IdentifierField()
			}),
			conversion: new SchemaField({
				value: new NumberField({
					initial: 1,
					positive: true,
					label: "BF.Currency.ConversionRatio.Label",
					hint: "BF.Currency.ConversionRatio.Hint"
				})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The abbreviated name for this currency.
	 * @type {string}
	 */
	get abbreviation() {
		return CONFIG.BlackFlag.currencies[this.parent.identifier]?.abbreviation ?? this.parent.identifier;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get chatTags() {
		const tags = this.parent.chatTags;
		tags.set("details", `${numberFormat(this.quantity)} ${this.abbreviation}`);
		this.setPhysicalChatTags(tags);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get equippable() {
		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.preparePhysicalLabels();
	}
}
