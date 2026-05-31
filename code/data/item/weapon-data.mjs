import {
	convertAmount,
	convertDistance,
	defaultUnit,
	formatDistance,
	formatNumber,
	stepDenomination
} from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import { DamageField } from "../fields/_module.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import IdentifiableTemplate from "./templates/identifiable-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import ProficiencyTemplate from "./templates/proficiency-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Weapon items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {IdentifiableTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {ProficiencyTemplate}
 * @mixes {PropertiesTemplate}
 *
 * @property {object} ammunition
 * @property {number} ammunition.capacity - Number of shots that can be held in a weapon with the magazine property.
 * @property {string} ammunition.type - Category of ammunition that can be used with this weapon.
 * @property {object} damage
 * @property {DamageField} damage.base - Base weapon damage.
 * @property {number} magicalBonus - Magical bonus added to attack & damage rolls.
 * @property {Set<string>} options - Weapon options that can be used with this weapon.
 * @property {object} range
 * @property {number} range.short - Short range of the weapon.
 * @property {number} range.long - Long range of the weapon.
 * @property {number} range.reach - Additional reach of the weapon beyond the wielder's normal reach.
 * @property {string} range.unit - Units used to measure range and reach.
 * @property {object} type
 * @property {string} type.value - Is this a melee or a ranged weapon?
 * @property {string} type.category - Weapon category as defined in `CONFIG.BlackFlag.weapons`.
 * @property {string} type.base - Specific weapon type defined as a child of its category.
 */
export default class WeaponData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	DescriptionTemplate,
	IdentifiableTemplate,
	PhysicalTemplate,
	ProficiencyTemplate,
	PropertiesTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.WEAPON", "BF.IDENTIFIABLE", "BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "weapon",
				category: "equipment",
				legacyMixin: false,
				localization: "BF.Item.Type.Weapon",
				icon: "fa-solid fa-trowel",
				img: "systems/black-flag/artwork/types/weapon.svg"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			ammunition: new SchemaField({
				capacity: new NumberField(),
				type: new StringField()
			}),
			damage: new SchemaField({
				base: new DamageField({ simple: true })
			}),
			magicalBonus: new NumberField({ integer: true }),
			options: new SetField(new StringField()),
			range: new SchemaField({
				short: new NumberField({ min: 0, step: 0.1 }),
				long: new NumberField({ min: 0, step: 0.1 }),
				reach: new NumberField({ min: 0, step: 0.1 }),
				unit: new StringField({ required: true, blank: false, initial: () => defaultUnit("distance") })
			}),
			type: new SchemaField({
				value: new StringField({ required: true, blank: false, initial: "melee", label: "BF.Equipment.Type.Label" }),
				category: new StringField({ label: "BF.Equipment.Category.Label" }),
				base: new StringField({ label: "BF.Equipment.Base.Label" })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static proficiencyCategory = "weapons";

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Magical bonus to attacks.
	 * @returns {number|null}
	 */
	get attackMagicalBonus() {
		return this.magicAvailable ? this.magicalBonus : null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get attackModes() {
		const modes = [];

		// All weapons except thrown ranged weapons, which will just display the "Thrown" mode
		if (!(this.properties.has("thrown") && this.type.value === "ranged")) {
			// Weapons without the "Two-Handed" property or with the "Versatile" property will have One-Handed attack
			if (this.properties.has("versatile") || !this.properties.has("twoHanded"))
				modes.push({
					value: "oneHanded",
					label: CONFIG.BlackFlag.attackModes.localized.oneHanded
				});

			// Weapons with the "Two-Handed" property or with the "Versatile" property will have Two-Handed attack
			if (this.properties.has("versatile") || this.properties.has("twoHanded"))
				modes.push({
					value: "twoHanded",
					label: CONFIG.BlackFlag.attackModes.localized.twoHanded
				});
		}

		// Weapons with the "Light" property will have Offhand attack
		if (this.properties.has("light"))
			modes.push({
				value: "offhand",
				label: CONFIG.BlackFlag.attackModes.localized.offhand
			});

		// Weapons with the "Thrown" property will have the Thrown attack
		if (this.properties.has("thrown")) {
			if (modes.length) modes.push({ rule: true });
			modes.push({ value: "thrown", label: CONFIG.BlackFlag.attackModes.localized.thrown });

			// Weapons with the "Thrown" & "Light" properties will have a Thrown Offhand attack
			if (this.properties.has("light"))
				modes.push({
					value: "thrownOffhand",
					label: CONFIG.BlackFlag.attackModes.localized.thrownOffhand
				});
		}

		return modes;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Abilities that could potentially be used with this weapon.
	 * @type {Set<string>}
	 */
	get availableAbilities() {
		const melee = CONFIG.BlackFlag.defaultAbilities.meleeAttack;
		const ranged = CONFIG.BlackFlag.defaultAbilities.rangedAttack;
		if (this.properties.has("finesse") || this.type.category === "natural") return new Set([melee, ranged]);
		return new Set([this.type.value === "ranged" ? ranged : melee]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get chatTags() {
		const tags = this.parent.chatTags;
		tags.set("type", this.typeLabel);
		if (this.rangeLabel) tags.set("range", this.rangeLabel);
		else if (this.reachLabel) tags.set("range", this.reachLabel);
		this.setPhysicalChatTags(tags);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Label for the range with unit.
	 * @type {string}
	 */
	get rangeLabel() {
		if (this.type.value !== "ranged" && !this.properties.has("thrown")) return "";

		const values = [];
		if (this.range.short) values.push(this.range.short);
		if (this.range.long && this.range.long !== this.range.short) values.push(this.range.long);
		const unit = this.range.unit ?? Object.keys(CONFIG.BlackFlag.distanceUnits)[0];
		if (!values.length || !unit) return "";

		const last = values.pop();
		return [...values.map(v => formatNumber(v)), formatDistance(last, unit, { unitDisplay: "short" })].filterJoin("/");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Label for the reach with unit.
	 * @type {string}
	 */
	get reachLabel() {
		if (this.type.value !== "melee") return "";
		return formatDistance(this.range.reach, this.range.unit, { unitDisplay: "short" });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get traits() {
		const traits = [
			CONFIG.BlackFlag.weaponTypes[this.type.value]?.label,
			...this.properties.map(p => CONFIG.BlackFlag.itemProperties.localized[p])
		];
		const listFormatter = game.i18n.getListFormatter({ type: "unit" });
		return listFormatter.format(traits.filter(t => t).map(t => _loc(t)));
		// Ranged
		// Reach (total)
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Combined label for the weapon's type (e.g. "Simple Melee Weapon").
	 * @type {string}
	 */
	get typeLabel() {
		return game.i18n
			.format("BF.WEAPON.Type.CombinedLabel[one]", {
				category: CONFIG.BlackFlag.weapons.localized[this.type.category] ?? "",
				type: CONFIG.BlackFlag.weaponTypes.localized[this.type.value] ?? ""
			})
			.replace("  ", " ")
			.trim();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Attack types that can be used with this item by default.
	 * @type {Set<string>}
	 */
	get validAttackTypes() {
		const types = new Set();
		if (this.type.value === "melee") types.add("melee");
		if (
			this.type.value === "ranged" ||
			this.properties.has("thrown") ||
			(this.type.category === "natural" && this.range.short)
		)
			types.add("ranged");
		return types;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get validCategories() {
		return CONFIG.BlackFlag.weapons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get validOptions() {
		return CONFIG.BlackFlag.weaponOptions;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get versatileDamage() {
		if (!this.properties.has("versatile") || !this.damage.base.denomination) return this.damage.base;
		return this.damage.base.clone({
			...this.damage.base,
			denomination: stepDenomination(this.damage.base.denomination)
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		source = super.migrateData(source);
		this._migrateSource(source);
		this._migrateWeightUnits(source);

		// Added in 0.10.042
		if ("damage" in source) {
			if ("number" in source.damage) foundry.utils.setProperty(source, "damage.base.number", source.damage.number);
			if ("denomination" in source.damage) {
				foundry.utils.setProperty(source, "damage.base.denomination", source.damage.denomination);
			}
			if ("type" in source.damage) foundry.utils.setProperty(source, "damage.base.type", source.damage.type);
			if ("additionalTypes" in source.damage) {
				foundry.utils.setProperty(source, "damage.base.additionalTypes", source.damage.additionalTypes);
			}
		}

		// Added in 2.0.068
		this._migrateObjectUnits(source.range);

		return source;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();
		this._shimObjectUnits("range");
		this._shimWeightUnits();

		Object.defineProperty(this.type, "classification", {
			value: "weapon",
			writable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.prepareDescription();
		this.prepareIdentifiable();
		this.preparePhysicalLabels();

		convertAmount(this.range, "distance", { keys: ["short", "long", "reach"] });

		if (this.type.value === "melee") {
			const unit = this.range.unit;
			let reach = convertDistance(this.parent.actor?.system.isSwarm ? 0 : 5, "foot", { to: unit }).value;
			if (this.properties.has("reach")) reach += this.range.reach ?? convertDistance(5, "foot", { to: unit }).value;
			this.range.reach = reach;
		}

		const type = CONFIG.BlackFlag.weapons.allLocalized[this.type.base ?? this.type.category];
		if (type) this.type.label = `${_loc("BF.WEAPON.Label[one]")} (${type})`;
		else this.type.label = _loc("BF.WEAPON.Label[one]");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();
		const rollData = this.parent.getRollData({ deterministic: true });
		this.prepareFinalActivities(rollData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		if ((await super._preCreate(data, options, user)) === false) return false;
		if (data._id || foundry.utils.hasProperty(data, "system.activities")) return;
		this._createInitialActivities([{ type: "attack" }]);
	}

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
		await this._preUpdateIdentifiable(changes, options, user);
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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getRollData(...args) {
		const rollData = super.getRollData(...args);
		rollData.labels ??= {};
		rollData.labels.range = this.rangeLabel;
		rollData.labels.reach = this.reachLabel;
		return rollData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async getSheetData(context, options) {
		const has = (data, key) => data.includes?.(key) ?? data.has?.(key);
		context.detailsParts = ["blackFlag.details-weapon"];
		context.options = Object.entries(context.system.validOptions ?? {}).reduce((obj, [k, o]) => {
			obj[k] = { label: _loc(o.label), selected: has(context.source.options, k) };
			return obj;
		}, {});
		context.reachPlaceholder = convertDistance(5, "foot", { to: this.range.unit }).value;
		context.type ??= {};
		context.type.options = CONFIG.BlackFlag.weaponTypes.localizedOptions;
	}
}
