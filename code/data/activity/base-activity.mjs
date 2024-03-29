import { numberFormat, replaceFormulaData, simplifyBonus } from "../../utils/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import TypeField from "../fields/type-field.mjs";
import UsesField from "../fields/uses-field.mjs";
import ConsumptionTargetData from "./consumption-target-data.mjs";

const {
	ArrayField, BooleanField, DocumentIdField, EmbeddedDataField,
	FilePathField, HTMLField, NumberField, SchemaField, StringField
} = foundry.data.fields;

/**
 * Data model for activities.
 */
export default class BaseActivity extends foundry.abstract.DataModel {

	/**
	 * Base type information for an activity.
	 *
	 * @typedef {PseudoDocumentsMetadata} BaseActivityMetadata
	 * @property {string} type - Type of the activity.
	 */

	/**
	 * @type {BaseActivityMetadata}
	 */
	static metadata = Object.freeze({
		name: "Activity",
		collection: "activities",
		label: "BF.Activity.Label[one]",
		type: "base"
	});

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Name of this activity type that will be stored in config and used for lookups.
	 * @type {string}
	 * @protected
	 */
	static get typeName() {
		return this.metadata.type ?? this.name.replace(/Activity$/, "");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			_id: new DocumentIdField({initial: () => foundry.utils.randomID()}),
			type: new StringField({
				required: true, readOnly: true, initial: this.typeName, validate: v => v === this.typeName,
				validationError: `must be the same as the Activity type name ${this.typeName}`
			}),
			name: new StringField({initial: undefined}),
			img: new FilePathField({initial: undefined, categories: ["IMAGE"]}),
			description: new HTMLField({label: "BF.Activity.Core.Description.Label"}),
			system: new TypeField({
				modelLookup: type => this.metadata.dataModel ?? null
			}),
			activation: new SchemaField({
				value: new NumberField({initial: undefined, min: 0, integer: true, label: "BF.Activation.Cost.Label"}),
				type: new StringField({initial: undefined, label: "BF.Activation.Type.Label"}),
				condition: new StringField({initial: undefined, label: "BF.Activation.Condition.Label"})
			}, {label: "BF.Activation.Label"}),
			consumption: new SchemaField({
				targets: new ArrayField(new EmbeddedDataField(ConsumptionTargetData)),
				scale: new SchemaField({
					allowed: new BooleanField({
						label: "BF.Consumption.AllowScaling.Label", hint: "BF.Consumption.AllowScaling.Hint"
					}),
					max: new FormulaField({label: "BF.Consumption.MaxScaling.Label", hint: "BF.Consumption.MaxScaling.Hint"})
				})
			}, {label: "BF.Consumption.Label"}),
			uses: new UsesField({consumeQuantity: false})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareFinalData() {
		const rollData = this.item.getRollData();
		const keyPrefix = `activity-${this.id}-invalid`;
		const name = `${this.item.name} (${this.name})`;
		this.uses.min = simplifyBonus(replaceFormulaData(this.uses.min ?? "", rollData, {
			notifications: this.item.notifications, key: `${keyPrefix}-min-uses-formula`, section: "auto",
			messageData: { name, property: game.i18n.localize("BF.Uses.Minimum.DebugName") }
		}));
		this.uses.max = simplifyBonus(replaceFormulaData(this.uses.max ?? "", rollData, {
			notifications: this.item.notifications, key: `${keyPrefix}-max-uses-formula`, section: "auto",
			messageData: { name, property: game.i18n.localize("BF.Uses.Maximum.DebugName") }
		}));
		this.uses.value = Math.clamped(this.uses.max - this.uses.spent, this.uses.min, this.uses.max);

		Object.defineProperty(this.uses, "label", {
			get() {
				if ( this.min ) return numberFormat(this.value);
				if ( this.max ) return `${numberFormat(this.value)} / ${numberFormat(this.max)}`;
				return "";
			},
			configurable: true,
			enumerable: false
		});

		const item = this.item.system ?? {};
		const propertiesToSet = [
			["activation.value", "casting.value"],
			["activation.type", "casting.type"],
			["activation.condition", "casting.condition"]
		];
		for ( const keyPath of propertiesToSet ) {
			const activityProperty = foundry.utils.getProperty(this, keyPath[0]);
			const itemProperty = foundry.utils.getProperty(item, keyPath[1]);
			if ( !activityProperty && itemProperty ) foundry.utils.setProperty(this, keyPath[0], itemProperty);
		}
		this.activation.type ??= "action";

		this.system.prepareFinalData?.();
	}
}
