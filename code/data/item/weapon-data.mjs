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
 * @property {object} type
 * @property {string} type.value - Is this a melee or a ranged weapon?
 * @property {string} type.category - Weapon category as defined in `CONFIG.BlackFlag.weapons`.
 * @property {string} type.base - Specific weapon type defined as a child of its category.
 * @property {Set<string>} options - Weapon options that can be used with this weapon.
 * @property {object} ammunition
 * @property {string} ammunition.type - Category of ammunition that can be used with this weapon.
 * @property {DamageField} damage - Base weapon damage.
 * @property {number} magicalBonus - Magical bonus added to attack & damage rolls.
 * @property {object} range
 * @property {number} range.short - Short range of the weapon.
 * @property {number} range.long - Long range of the weapon.
 * @property {number} range.reach - Additional reach of the weapon beyond the wielder's normal reach.
 * @property {string} range.units - Units used to measure range and reach.
 */
export default class WeaponData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	DescriptionTemplate,
	PhysicalTemplate,
	ProficiencyTemplate,
	PropertiesTemplate
) {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "weapon",
			category: "equipment",
			localization: "BF.Item.Type.Weapon",
			icon: "fa-solid fa-trowel",
			img: "systems/black-flag/artwork/types/weapon.svg"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			type: new SchemaField({
				value: new StringField({ initial: "melee", label: "BF.Weapon.Type.Label" }),
				category: new StringField({ label: "BF.Equipment.Category.Label" }),
				base: new StringField({ label: "BF.Equipment.Base.Label" })
			}),
			options: new SetField(new StringField(), {
				label: "BF.Weapon.Option.Label[other]"
			}),
			ammunition: new SchemaField(
				{
					type: new StringField({ label: "BF.Ammunition.Type.Label" })
				},
				{ label: "BF.Item.Type.Ammunition[one]" }
			),
			damage: new DamageField({ simple: true }),
			magicalBonus: new NumberField({
				integer: true,
				label: "BF.Weapon.MagicalBonus.Label",
				hint: "BF.Weapon.MagicalBonus.Hint"
			}),
			range: new SchemaField(
				{
					short: new NumberField({ min: 0, step: 0.1, label: "BF.Range.Short.Label" }),
					long: new NumberField({ min: 0, step: 0.1, label: "BF.Range.Long.Label" }),
					reach: new NumberField({ min: 0, step: 0.1, label: "BF.Reach.Label" }),
					units: new StringField()
				},
				{ label: "BF.Range.Label" }
			)

			// Attack ability override
			// Damage ability override
			// Critical threshold override
			// Attack bonus
			// Damage bonus
			// Critical damage bonus
			// Critical dice bonus
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
	 * Magical bonus to damage.
	 * @returns {number|null}
	 */
	get damageMagicalBonus() {
		return this.magicAvailable ? this.magicalBonus : null;
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
			.format("BF.Weapon.Type.CombinedLabel", {
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
		if (!this.properties.has("versatile") || !this.damage.denomination) return this.damage;
		const data = foundry.utils.deepClone(this.damage);
		data.denomination = stepDenomination(data.denomination);
		return this.constructor.schema.fields.damage.initialize(data, this);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
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
		this.preparePhysicalLabels();
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
}
