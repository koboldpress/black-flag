import { stepDenomination } from "../../utils/_module.mjs";
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
 */
export default class WeaponData extends ItemDataModel.mixin(
	ActivitiesTemplate, DescriptionTemplate, PhysicalTemplate, ProficiencyTemplate, PropertiesTemplate
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
				value: new StringField({initial: "melee", label: "BF.Weapon.Type.Label"}),
				category: new StringField({label: "BF.Equipment.Category.Label"}),
				base: new StringField({label: "BF.Equipment.Base.Label"})
			}),
			options: new SetField(new StringField(), {
				label: "BF.Weapon.Option.Label[other]"
			}),
			ammunition: new SchemaField({
				type: new StringField({label: "BF.Ammunition.Type.Label"})
			}, {label: "BF.Item.Type.Ammunition[one]"}),
			damage: new DamageField({bonus: false}),
			range: new SchemaField({
				short: new NumberField({min: 0, step: 0.1, label: "BF.Range.Short.Label"}),
				long: new NumberField({min: 0, step: 0.1, label: "BF.Range.Long.Label"}),
				reach: new NumberField({min: 0, step: 0.1, label: "BF.Reach.Label"}),
				units: new StringField()
			}, {label: "BF.Range.Label"})

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

	/** @inheritDoc */
	static proficiencyCategory = "weapons";

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability used for attacks and damage with this weapon.
	 * @type {string|null}
	 */
	get ability() {
		const melee = CONFIG.BlackFlag.defaultAbilities.meleeAttack;
		const ranged = CONFIG.BlackFlag.defaultAbilities.rangedAttack;

		if ( this.properties.has("finesse") ) {
			const abilities = this.parent.actor?.system.abilities;
			if ( abilities ) return abilities[ranged]?.mod > abilities[melee]?.mod ? ranged : melee;
		}

		return this.type.value === "ranged" ? ranged : melee;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
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

	/** @inheritDoc */
	get validCategories() {
		return CONFIG.BlackFlag.weapons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get validOptions() {
		return CONFIG.BlackFlag.weaponOptions;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get versatileDamage() {
		if ( !this.properties.has("versatile") || !this.damage.denomination ) return this.damage;
		const data = foundry.utils.deepClone(this.damage);
		data.denomination = stepDenomination(data.denomination);
		return this.constructor.schema.fields.damage.initialize(data, this);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseProperties() {
		Object.defineProperty(this.type, "classification", {
			value: "weapon",
			writable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_preCreateActivities(data, options, user) {
		if ( data._id || foundry.utils.hasProperty(data, "system.activities") ) return;
		this._createInitialActivities([{ type: "attack" }]);
	}
}
