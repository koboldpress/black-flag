import { numberFormat, replaceFormulaData, simplifyBonus } from "../../utils/_module.mjs";
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
 *
 * @property {string} _id - Unique ID for the activity on an item.
 * @property {string} type - Type name of the activity used to build a specific activity class.
 * @property {string} name - Name for this activity.
 * @property {string} img - Image that represents this activity.
 * @property {*} system - Type-specific data.
 * @property {ActivationField} activation
 * @property {number} activation.primary - Is this the primary activation for this item? Mainly used to indicate what
 *                                         activity corresponds with casting a spell.
 * @property {object} consumption
 * @property {ConsumptionTargetData[]} consumption.targets - Collection of consumption targets.
 * @property {object} consumption.scaling
 * @property {boolean} consumption.scaling.allowed - Can this non-spell activity be activated at higher levels?
 * @property {string} consumption.scaling.max - Maximum number of scaling levels for this item.
 * @property {DurationField} duration
 * @property {boolean} duration.override - Should the item's duration be overridden?
 * @property {RangeField} range
 * @property {TargetField} target
 * @property {boolean} target.override - Should the item's targeting data be overridden?
 * @property {UsesField} uses
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
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = [
		"BF.ACTIVITY",
		"BF.ACTIVATION",
		"BF.CONSUMPTION",
		"BF.DURATION",
		"BF.RANGE",
		"BF.TARGET",
		"BF.USES"
	];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
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
			description: new HTMLField(),
			system: new TypeField({ modelLookup: type => this.metadata.dataModel ?? null }),
			activation: new ActivationField({
				primary: new BooleanField({ required: false, initial: undefined })
			}),
			consumption: new SchemaField({
				targets: new ArrayField(new EmbeddedDataField(ConsumptionTargetData)),
				scale: new SchemaField({
					allowed: new BooleanField(),
					max: new FormulaField()
				})
			}),
			duration: new DurationField({
				override: new BooleanField()
			}),
			range: new RangeField(),
			target: new TargetField({
				override: new BooleanField()
			}),
			uses: new UsesField({ consumeQuantity: false })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate custom damage formulas to object.
	 * Added in 0.9.035
	 * @param {DamageField} source - Candidate source data for a damage entry to migrate.
	 */
	static _migrateCustomDamageFormula(source) {
		if (foundry.utils.getType(source.custom) === "string") {
			source.custom = { enabled: source.custom !== "", formula: source.custom };
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareFinalData() {
		const rollData = this.item.getRollData();
		this.uses.prepareData(rollData);

		const prepareFinalValue = (keyPath, label) =>
			foundry.utils.setProperty(
				this,
				keyPath,
				simplifyBonus(
					replaceFormulaData(foundry.utils.getProperty(this, keyPath) ?? "", rollData, {
						notifications: this.item.notifications,
						key: `activity-${this.id}-invalid-target-${keyPath.replaceAll(".", "-")}`,
						section: "auto",
						messageData: {
							name: `${this.item.name} (${this.name})`,
							property: game.i18n.localize(label)
						}
					})
				)
			);

		this.setProperty("activation.value", "system.casting.value");
		this.setProperty("activation.type", "system.casting.type");
		this.setProperty("activation.condition", "system.casting.condition");

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

		Object.defineProperty(this, "_inferredSource", {
			value: this.toObject(false),
			configurable: false,
			enumerable: false,
			writable: false
		});

		prepareFinalValue("duration.value", "BF.DURATION.Label");
		prepareFinalValue("target.affects.count", "BF.TARGET.Label[other]");
		prepareFinalValue("target.template.size", "BF.AreaOfEffect.Size.Label");
		prepareFinalValue("target.template.width", "BF.AreaOfEffect.Size.Width");
		prepareFinalValue("target.template.height", "BF.AreaOfEffect.Size.Height");
		prepareFinalValue("uses.min", "BF.Uses.Mininum.DebugName");
		prepareFinalValue("uses.max", "BF.Uses.Maximum.DebugName");

		this.activation.type ??= "action";
		this.activation.primary ??= true;

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
				if (target.target && target.type === "item") {
					if (target.target?.includes(".")) {
						const item = this.item.actor.sourcedItems?.get(target.target)?.first();
						if (item) target.target = item.id;
					}
					if (!this.item.actor.items.get(target.target))
						this.item.notifications.set(`activity-${this.id}-missing-consumption-${target.target}`, {
							level: "error",
							section: "auto",
							message: game.i18n.format("BF.Consumption.Warning.MissingItem", { activity: this.name })
						});
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
