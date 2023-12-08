import { numberFormat, replaceFormulaData, simplifyBonus } from "../../utils/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import TypeField from "../fields/type-field.mjs";
import UsesField from "../fields/uses-field.mjs";
import ConsumptionTargetData from "./consumption-target-data.mjs";

const {
	ArrayField, BooleanField, DocumentIdField, EmbeddedDataField, FilePathField, SchemaField, StringField
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

	static defineSchema() {
		return {
			_id: new DocumentIdField({initial: () => foundry.utils.randomID()}),
			type: new StringField({
				required: true, readOnly: true, initial: this.typeName, validate: v => v === this.typeName,
				validationError: `must be the same as the Activity type name ${this.typeName}`
			}),
			name: new StringField({initial: undefined}),
			img: new FilePathField({initial: undefined, categories: ["IMAGE"]}),
			system: new TypeField({
				modelLookup: type => this.metadata.dataModel ?? null
			}),
			consumption: new SchemaField({
				targets: new ArrayField(new EmbeddedDataField(ConsumptionTargetData)),
				scale: new SchemaField({
					allowed: new BooleanField({label: "BF.Consumption.AllowScaling.Label"}),
					max: new FormulaField() // Maximum number of steps above baseline this can be scaled
				})
			}, {label: "BF.Consumption.Label"}),
			uses: new UsesField()
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
	}
}
