import {
	convertAmount,
	formatNumber,
	prepareFormulaValue,
	replaceFormulaData,
	simplifyBonus
} from "../../utils/_module.mjs";
import BaseDataModel from "../abstract/base-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import IdentifierField from "../fields/identifier-field.mjs";
import TypeField from "../fields/type-field.mjs";
import ActivationField from "../fields/shared/activation-field.mjs";
import DurationField from "../fields/shared/duration-field.mjs";
import RangeField from "../fields/shared/range-field.mjs";
import TargetField from "../fields/shared/target-field.mjs";
import UsesField from "../fields/shared/uses-field.mjs";
import ConsumptionTargetsField from "./fields/consumption-targets-field.mjs";

const {
	BooleanField,
	DocumentFlagsField,
	DocumentIdField,
	FilePathField,
	HTMLField,
	IntegerSortField,
	NumberField,
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
 * @property {string} description - Activity's description.
 * @property {Record<string, object>} flags - Flag data.
 * @property {number} sort - Sorting order for the activity.
 * @property {*} system - Type-specific data.
 * @property {ActivationField} activation
 * @property {boolean} activation.override - Should the item's activation be overridden?
 * @property {number} activation.primary - Is this the primary activation for this item? Mainly used to indicate what
 *                                         activity corresponds with casting a spell.
 * @property {object} consumption
 * @property {ConsumptionTargetData[]} consumption.targets - Collection of consumption targets.
 * @property {object} consumption.scale
 * @property {boolean} consumption.scale.allowed - Can this non-spell activity be activated at higher levels?
 * @property {string} consumption.scale.max - Maximum number of scaling levels for this item.
 * @property {DurationField} duration
 * @property {boolean} duration.concentration - Does this activity require concentration?
 * @property {boolean} duration.override - Should the item's duration be overridden?
 * @property {RangeField} range
 * @property {boolean} range.override - Should the item's range be overridden?
 * @property {boolean} magical - Is this considered a magical effect?
 * @property {TargetField} target
 * @property {boolean} target.prompt - Should template placement be checked by default?
 * @property {boolean} target.override - Should the item's targeting data be overridden?
 * @property {UsesField} uses
 * @property {object} visibility
 * @property {string} visibility.identifier - Class identifier that will be used to determine applicable level.
 * @property {object} visibility.level
 * @property {number} visibility.level.min - Minimum level at which this activity can be used.
 * @property {number} visibility.level.max - Maximum level at which this activity can be used.
 * @property {boolean} visibility.requireAttunement - Not usable if item requires attunement and isn't attuned.
 * @property {boolean} visibility.requireIdentification - Not usable or visible if item isn't identified.
 * @property {boolean} visibility.requireMagic - Not usable if magic isn't available.
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
		label: "BF.ACTIVITY.Label[one]",
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
			img: new FilePathField({ blank: true, initial: undefined, categories: ["IMAGE"], base64: false }),
			description: new HTMLField(),
			flags: new DocumentFlagsField(),
			sort: new IntegerSortField(),
			system: new TypeField({ modelLookup: type => this.metadata.dataModel ?? null }),
			activation: new ActivationField({
				override: new BooleanField(),
				primary: new BooleanField({ required: false, initial: true })
			}),
			consumption: new SchemaField({
				scale: new SchemaField({
					allowed: new BooleanField(),
					max: new FormulaField()
				}),
				targets: new ConsumptionTargetsField()
			}),
			duration: new DurationField({
				concentration: new BooleanField(),
				override: new BooleanField()
			}),
			range: new RangeField({
				override: new BooleanField()
			}),
			magical: new BooleanField(),
			target: new TargetField({
				prompt: new BooleanField({ initial: true }),
				override: new BooleanField()
			}),
			uses: new UsesField({ consumeQuantity: false }),
			visibility: new SchemaField({
				identifier: new IdentifierField({ label: null, hint: null }),
				level: new SchemaField({
					min: new NumberField({ integer: true, min: 0 }),
					max: new NumberField({ integer: true, min: 0 })
				}),
				requireAttunement: new BooleanField(),
				requireIdentification: new BooleanField(),
				requireMagic: new BooleanField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should the magical status of this activity be inherited from its containing item?
	 * @type {boolean}
	 */
	get inheritMagical() {
		return this.isSpell || this.item.system.validProperties?.has("magical");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this activity a rider for a non-applied enchantment?
	 * @type {boolean}
	 */
	get isRider() {
		return this.item.flags[game.system.id]?.rider?.activities?.includes(this.id);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine the level used to determine visibility limits, based on the spell circle for spells or either the
	 * character or class level, depending on whether `classIdentifier` is set.
	 * @type {number}
	 */
	get relevantLevel() {
		const keyPath =
			this.item.type === "spell" && this.item.system.circle.base > 0
				? "item.circle.base"
				: this.visibility.identifier
					? `progression.classes.${this.visibility.identifier}.levels`
					: "progression.level";
		return foundry.utils.getProperty(this.getRollData(), keyPath) ?? 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		source = super.migrateData(source);
		if (!source) return source;

		// Added in 2.0.068
		BaseDataModel._migrateObjectUnits(source.duration);
		BaseDataModel._migrateObjectUnits(source.range);
		BaseDataModel._migrateObjectUnits(source.target?.template);
		if (source.system?.summon?.identifier) {
			foundry.utils.setProperty(source, "visibility.identifier", source.system.summon.identifier);
			delete source.system.summon.identifier;
		}

		return source;
	}

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
	prepareData() {
		BaseDataModel.prototype._shimObjectUnits.call(this, "duration");
		BaseDataModel.prototype._shimObjectUnits.call(this, "range");
		BaseDataModel.prototype._shimObjectUnits.call(this, "target.template");

		this.name = this.name || _loc(this.constructor.metadata.title);
		this.img = this.img || this.constructor.metadata.icon;
		this.system.prepareData?.();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareFinalData(rollData) {
		rollData ??= this.getRollData({ deterministic: true });
		this.uses.prepareData(rollData);

		this.setProperty("activation.value", "system.casting.value");
		this.setProperty("activation.type", "system.casting.type");
		this.setProperty("activation.condition", "system.casting.condition");

		this._setOverride("activation", "casting");
		this._setOverride("duration");
		this._setOverride("range");
		this._setOverride("target");

		Object.defineProperty(this, "_inferredSource", {
			value: this.toObject(false),
			configurable: false,
			enumerable: false,
			writable: false
		});

		if (this.visibility && !this.isRider) {
			if (!this.item.system.properties?.has("magical") && this.item.system.validProperties?.has("magical")) {
				this.visibility.requireAttunement = false;
				this.visibility.requireMagic = false;
			} else if (this.item.system.attunement?.value === "required" && this.visibility.requireMagic) {
				this.visibility.requireAttunement = true;
			} else if (!this.item.system.attunable) {
				this.visibility.requireAttunement = false;
			}
			if (!this.item.system.identifiable) this.visibility.requireIdentification = false;
		}

		prepareFormulaValue(this, "duration.value", "BF.DURATION.Label", rollData);
		prepareFormulaValue(this, "target.affects.count", "BF.TARGET.Label[other]", rollData);
		prepareFormulaValue(this, "target.template.count", "BF.TARGET.FIELDS.template.count.label", rollData);
		prepareFormulaValue(this, "target.template.size", "BF.AreaOfEffect.Size.Label", rollData);
		prepareFormulaValue(this, "target.template.width", "BF.AreaOfEffect.Size.Width", rollData);
		prepareFormulaValue(this, "target.template.height", "BF.AreaOfEffect.Size.Height", rollData);
		prepareFormulaValue(this, "uses.max", "BF.Uses.Maximum.DebugName", rollData);

		convertAmount(this.range, "distance");
		convertAmount(this.target.template, "distance", { keys: ["size", "width", "height"] });

		TargetField.prepareData.call(this, rollData);

		this.activation.type ??= "action";
		this.activation.primary ??= true;

		// TODO: Add ability to have uses increase without clamping to max
		this.uses.value = Math.clamp(this.uses.max - this.uses.spent, 0, this.uses.max);
		Object.defineProperty(this.uses, "label", {
			get() {
				if (this.max) return `${formatNumber(this.value)} / ${formatNumber(this.max)}`;
				return "";
			},
			configurable: true,
			enumerable: false
		});

		if (this.item.isEmbedded) {
			for (const target of this.consumption.targets) {
				if (target.type !== "item" || !target.target) continue;

				// Re-link UUID or identifier target to explicit item on the actor
				target.target = this._remapConsumptionTarget(target.target);

				// If targeted item isn't found, display preparation warning
				if (!this.item.actor.items.get(target.target))
					this.item.notifications.set(`activity-${this.id}-missing-consumption-${target.target}`, {
						level: "error",
						section: "auto",
						message: _loc("BF.CONSUMPTION.Warning.MissingItem", { activity: this.name })
					});
			}
		}

		if (this.inheritMagical) this.magical = this.isSpell || this.item.system.properties.has("magical");

		this.system.prepareFinalData?.(rollData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remap a UUID or identifier in a consumption target to the ID of an item on the actor.
	 * @param {string} target
	 * @returns {string}
	 * @internal
	 */
	_remapConsumptionTarget(target) {
		if (!target || !this.actor || this.actor.items.has(target)) return target;

		// Re-link UUID target
		const { type } = foundry.utils.parseUuid(target) ?? {};
		if (type === "Item") {
			const item = this.actor.sourcedItems?.get(target)?.first();
			if (item) return item.id;
		}

		// Re-link identifier target
		else {
			const item = this.actor.identifiedItems?.get(target)?.first();
			if (item) return item.id;
		}

		return target;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add an `canOverride` property to the provided object and, if `override` is `false`, replace the data on the
	 * activity with data from the item.
	 * @param {string} activityKeyPath - Path of the property to set on the activity.
	 * @param {string} [itemKeyPath] - Optional item key path, if different than actor key path.
	 * @param {BlackFlagItem} [item] - Item to act as the source of the override.
	 * @internal
	 */
	_setOverride(activityKeyPath, itemKeyPath, item = this.item) {
		const obj = foundry.utils.getProperty(this, activityKeyPath);
		Object.defineProperty(obj, "canOverride", {
			value: foundry.utils.hasProperty(item.system, itemKeyPath ?? activityKeyPath),
			configurable: true,
			enumerable: false
		});
		if (obj.canOverride && !obj.override) {
			foundry.utils.mergeObject(obj, foundry.utils.getProperty(item.system, itemKeyPath ?? activityKeyPath));
		}
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
