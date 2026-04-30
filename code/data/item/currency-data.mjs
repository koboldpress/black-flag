import CurrencySheet from "../../applications/item/currency-sheet.mjs";
import { formatNumber } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Currency items.
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 *
 * @property {object} conversion
 * @property {number} conversion.value - Rate at which this currency is converted into a standard baseline.
 */
export default class CurrencyData extends ItemDataModel.mixin(DescriptionTemplate, PhysicalTemplate) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "currency",
				category: "meta",
				legacyMixin: false,
				localization: "BF.Item.Type.Currency",
				icon: "fa-solid fa-boxes-stacked",
				img: "systems/black-flag/artwork/types/currency.svg",
				hasDetails: false,
				hasEffects: false,
				register: {
					cache: true
				},
				sheet: {
					application: CurrencySheet,
					label: "BF.Sheet.Default.Currency"
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			conversion: new SchemaField({
				value: new NumberField({
					initial: 1,
					positive: true,
					label: "BF.Currency.ConversionRatio.Label",
					hint: "BF.Currency.ConversionRatio.Hint"
				})
			}),
			price: false,
			weight: new SchemaField(
				{
					value: new NumberField({ initial: 0.32 }),
					unit: new StringField({ initial: "ounce" }) // TODO: Select default units
				},
				{ label: "BF.Weight.Label" }
			)
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
		tags.set("details", `${formatNumber(this.quantity)} ${this.abbreviation}`);
		this.setPhysicalChatTags(tags);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get equippable() {
		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		source = super.migrateData(source);
		this._migrateSource(source);
		this._migrateWeightUnits(source);
		return source;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();
		this._shimWeightUnits();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.prepareDescription();
		this.preparePhysicalLabels();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		this._onCreatePhysicalItem(data, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preUpdate(changes, options, user) {
		if ((await super._preUpdate(changes, options, user)) === false) return false;
		await this._preUpdatePhysicalItem(changes, options, user);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onUpdate(changed, options, userId) {
		await super._onUpdate(changed, options, userId);
		this._onUpdatePhysicalItem(changed, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDelete(options, userId) {
		await super._onDelete(options, userId);
		this._onDeletePhysicalItem(options, userId);
	}
}
