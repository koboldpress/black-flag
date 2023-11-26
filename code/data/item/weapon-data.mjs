import ItemDataModel from "../abstract/item-data-model.mjs";
import { DamageField } from "../fields/_module.mjs";
import { ActivitiesTemplate, ProficiencyTemplate, PhysicalTemplate } from "./templates/_module.mjs";

const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Weapon items.
 * @mixes ActivitiesTemplate
 * @mixes ProficiencyTemplate
 * @mixes PhysicalTemplate
 */
export default class WeaponData extends ItemDataModel.mixin(ActivitiesTemplate, ProficiencyTemplate, PhysicalTemplate) {

	static get metadata() {
		return {
			type: "weapon",
			category: "equipment",
			localization: "BF.Item.Type.Weapon",
			icon: "fa-solid fa-trowel"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			type: new SchemaField({
				value: new StringField({initial: "melee", label: "BF.Weapon.Type.Label"}),
				category: new StringField({label: "BF.Equipment.Category.Label"}),
				base: new StringField({label: "BF.Equipment.Base.Label"})
			}),
			options: new SetField(new StringField(), {
				label: "BF.Weapon.Option.Label[other]"
			}),
			properties: new SetField(new StringField(), {
				label: "BF.Property.Label[other]"
			}),
			ammunition: new SchemaField({
				type: new StringField({label: "BF.Ammunition.Type.Label"})
			}, {label: "BF.Item.Type.Ammunition[one]"}),
			damage: new DamageField(),
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

	get traits() {
		const traits = [
			CONFIG.BlackFlag.weaponTypes[this.type.value]?.label,
			...this.properties.map(p => this.validProperties[p]?.label)
		];
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit" });
		return listFormatter.format(traits.filter(t => t).map(t => game.i18n.localize(t)));
		// Ranged
		// Reach (total)
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get validCategories() {
		return CONFIG.BlackFlag.weapons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get validOptions() {
		return CONFIG.BlackFlag.weaponOptions;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get validProperties() {
		return CONFIG.BlackFlag.weaponProperties;
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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritdoc */
	*actions() {
		// TODO: Only return activities if weapon is equipped
		for ( const action of super.actions() ) {
			yield action;
		}
	}
}
