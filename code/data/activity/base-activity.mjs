import { getPluralRules, makeLabel, numberFormat, replaceFormulaData, simplifyBonus } from "../../utils/_module.mjs";
import ActivationField from "../fields/activation-field.mjs";
import DurationField from "../fields/duration-field.mjs";
import FormulaField from "../fields/formula-field.mjs";
import RangeField from "../fields/range-field.mjs";
import TargetField from "../fields/target-field.mjs";
import TypeField from "../fields/type-field.mjs";
import UsesField from "../fields/uses-field.mjs";
import ConsumptionTargetData from "./consumption-target-data.mjs";

const {
	ArrayField,
	BooleanField,
	DocumentIdField,
	EmbeddedDataField,
	FilePathField,
	HTMLField,
	SchemaField,
	StringField
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
			_id: new DocumentIdField({ initial: () => foundry.utils.randomID() }),
			type: new StringField({
				required: true,
				readOnly: true,
				initial: this.typeName,
				validate: v => v === this.typeName,
				validationError: `must be the same as the Activity type name ${this.typeName}`
			}),
			name: new StringField({ initial: undefined }),
			img: new FilePathField({ initial: undefined, categories: ["IMAGE"] }),
			description: new HTMLField({ label: "BF.Activity.Core.Description.Label" }),
			system: new TypeField({
				modelLookup: type => this.metadata.dataModel ?? null
			}),
			activation: new ActivationField({
				primary: new BooleanField({
					required: false,
					initial: undefined,
					label: "BF.Activation.Primary.Label",
					hint: "BF.Activation.Primary.Hint"
				})
			}),
			consumption: new SchemaField(
				{
					targets: new ArrayField(new EmbeddedDataField(ConsumptionTargetData)),
					scale: new SchemaField({
						allowed: new BooleanField({
							label: "BF.Consumption.AllowScaling.Label",
							hint: "BF.Consumption.AllowScaling.Hint"
						}),
						max: new FormulaField({ label: "BF.Consumption.MaxScaling.Label", hint: "BF.Consumption.MaxScaling.Hint" })
					})
				},
				{ label: "BF.Consumption.Label" }
			),
			duration: new DurationField({
				override: new BooleanField({ label: "BF.Duration.Override.Label" })
			}),
			range: new RangeField(),
			target: new TargetField({
				override: new BooleanField({ label: "BF.Target.Override.Label" })
			}),
			uses: new UsesField({ consumeQuantity: false })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		this.uses.prepareData();

		const rollData = this.item.getRollData();
		const keyPrefix = `activity-${this.id}-invalid`;
		const name = `${this.item.name} (${this.name})`;
		this.uses.min = simplifyBonus(
			replaceFormulaData(this.uses.min ?? "", rollData, {
				notifications: this.item.notifications,
				key: `${keyPrefix}-min-uses-formula`,
				section: "auto",
				messageData: { name, property: game.i18n.localize("BF.Uses.Minimum.DebugName") }
			})
		);
		this.uses.max = simplifyBonus(
			replaceFormulaData(this.uses.max ?? "", rollData, {
				notifications: this.item.notifications,
				key: `${keyPrefix}-max-uses-formula`,
				section: "auto",
				messageData: { name, property: game.i18n.localize("BF.Uses.Maximum.DebugName") }
			})
		);
		this.uses.value = Math.clamp(this.uses.max - this.uses.spent, this.uses.min, this.uses.max);

		Object.defineProperty(this.uses, "label", {
			get() {
				if (this.min) return numberFormat(this.value);
				if (this.max) return `${numberFormat(this.value)} / ${numberFormat(this.max)}`;
				return "";
			},
			configurable: true,
			enumerable: false
		});

		// Re-link UUIDs in consumption fields to explicit items
		if (this.item.isEmbedded) {
			for (const target of this.consumption.targets) {
				if (target.type === "item" && target.target?.includes(".")) {
					const item = this.item.actor.sourcedItems?.get(target.target);
					if (item) target.target = item.id;
				}
			}
		}

		this.setProperty("activation.value", "system.casting.value");
		this.setProperty("activation.type", "system.casting.type");
		this.setProperty("activation.condition", "system.casting.condition");
		this.activation.type ??= "action";
		this.activation.primary ??= true;

		Object.defineProperty(this.duration, "canOverride", {
			value: !!this.item.system.duration,
			configurable: true,
			enumerable: false
		});
		if (this.duration.canOverride && !this.duration.override) {
			for (const [key, value] of Object.entries(this.item.system.duration)) {
				foundry.utils.setProperty(this, `duration.${key}`, value);
			}
		}

		Object.defineProperty(this.target, "canOverride", {
			value: !!this.item.system.range && !!this.item.system.target,
			configurable: true,
			enumerable: false
		});
		if (this.target.canOverride && !this.target.override) {
			for (const keyPath of ["range", "target.template", "target.affects"]) {
				const obj = foundry.utils.getProperty(this.item.system, keyPath) ?? {};
				for (const [key, value] of Object.entries(obj)) {
					foundry.utils.setProperty(this, `${keyPath}.${key}`, value);
				}
			}
		}

		this.system.prepareFinalData?.();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set a property on the activity with a value from the item so long as it is currently blank and the item's
	 * property isn't blank.
	 * @param {string} activityKeyPath - Path of the property to set on the activity.
	 * @param {string} itemKeyPath - Path of the property to get from the item.
	 */
	setProperty(activityKeyPath, itemKeyPath) {
		const activityProperty = foundry.utils.getProperty(this, activityKeyPath);
		const itemProperty = foundry.utils.getProperty(this.item, itemKeyPath);
		if (!activityProperty && itemProperty) foundry.utils.setProperty(this, activityKeyPath, itemProperty);
	}
}
