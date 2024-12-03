import { numberFormat, stepDenomination } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import { DamageField } from "../fields/_module.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import ProficiencyTemplate from "./templates/proficiency-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Weapon items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
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
 * @property {string} range.units - Units used to measure range and reach.
 * @property {object} type
 * @property {string} type.value - Is this a melee or a ranged weapon?
 * @property {string} type.category - Weapon category as defined in `CONFIG.BlackFlag.weapons`.
 * @property {string} type.base - Specific weapon type defined as a child of its category.
 */
export default class WeaponData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	DescriptionTemplate,
	PhysicalTemplate,
	ProficiencyTemplate,
	PropertiesTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.WEAPON", "BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "weapon",
				category: "equipment",
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
				units: new StringField()
			}),
			type: new SchemaField({
				value: new StringField({ initial: "melee" }),
				category: new StringField(),
				base: new StringField()
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
		if (this.properties.has("finesse")) return new Set([melee, ranged]);
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
	 * Label for the range with units.
	 * @type {string}
	 */
	get rangeLabel() {
		if (this.type.value !== "ranged" && !this.properties.has("thrown")) return "";

		const values = [];
		if (this.range.short) values.push(this.range.short);
		if (this.range.long && this.range.long !== this.range.short) values.push(this.range.long);
		const unit = CONFIG.BlackFlag.distanceUnits[this.range.units] ?? Object.values(CONFIG.BlackFlag.distanceUnits)[0];
		if (!values.length || !unit) return "";

		const lengths = values.map(v => numberFormat(v)).join("/");
		return `${lengths} ${game.i18n.localize(unit.abbreviation)}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Label for the reach with units.
	 * @type {string}
	 */
	get reachLabel() {
		if (this.type.value !== "melee") return "";

		const unit = CONFIG.BlackFlag.distanceUnits[this.range.units] ?? Object.values(CONFIG.BlackFlag.distanceUnits)[0];
		// TODO: Define starting reach for imperial/metric
		const reach = this.properties.has("reach") ? this.range.reach || 5 : 0;
		return numberFormat(5 + reach, { unit: unit?.formattingUnit });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get traits() {
		const traits = [
			CONFIG.BlackFlag.weaponTypes[this.type.value]?.label,
			...this.properties.map(p => CONFIG.BlackFlag.itemProperties.localized[p])
		];
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit" });
		return listFormatter.format(traits.filter(t => t).map(t => game.i18n.localize(t)));
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
		super.migrateData(source);

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
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		this.applyShims();
		super.prepareBaseData();

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
		this.preparePhysicalLabels();

		const type = CONFIG.BlackFlag.weapons.localized[this.type.base ?? this.type.category];
		if (type) this.type.label = `${game.i18n.localize("BF.WEAPON.Label[one]")} (${type})`;
		else this.type.label = game.i18n.localize("BF.WEAPON.Label[one]");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();
		const rollData = this.parent.getRollData({ deterministic: true });
		this.prepareFinalActivities(rollData);
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
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_preCreateActivities(data, options, user) {
		if (data._id || foundry.utils.hasProperty(data, "system.activities")) return;
		this._createInitialActivities([{ type: "attack" }]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Shims                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add shims for removed properties.
	 */
	applyShims() {
		const log = () =>
			foundry.utils.logCompatibilityWarning("The `damage` data on `WeaponData` has been moved to `damage.base`", {
				since: "Black Flag 0.10.042",
				until: "Black Flag 0.10.047"
			});
		Object.defineProperty(this.damage, "number", {
			get() {
				log();
				return this.damage.base.number;
			},
			configurable: true
		});
		Object.defineProperty(this.damage, "denomination", {
			get() {
				log();
				return this.damage.base.denomination;
			},
			configurable: true
		});
		Object.defineProperty(this.damage, "type", {
			get() {
				log();
				return this.damage.base.type;
			},
			configurable: true
		});
		Object.defineProperty(this.damage, "additionalTypes", {
			get() {
				log();
				return this.damage.base.additionalTypes;
			},
			configurable: true
		});
	}
}
