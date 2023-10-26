import ItemDataModel from "../abstract/item-data-model.mjs";
import ProficiencyTemplate from "./templates/proficiency-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

/**
 * Data definition for Weapon items.
 * @mixes ProficiencyTemplate
 * @mixes PhysicalTemplate
 */
export default class WeaponData extends ItemDataModel.mixin(ProficiencyTemplate, PhysicalTemplate) {

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
			description: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new foundry.data.fields.StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			type: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.StringField({initial: "melee"}),
				category: new foundry.data.fields.StringField({label: "BF.Equipment.Category.Label"}),
				base: new foundry.data.fields.StringField({label: "BF.Equipment.Base.Label"})
			}),
			options: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				label: "BF.Weapon.Option.Label[other]"
			}),
			properties: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				label: "BF.Property.Label[other]"
			}),
			ammunition: new foundry.data.fields.SchemaField({
				type: new foundry.data.fields.StringField({label: "BF.Ammunition.Type.Label"})
			}, {label: "BF.Item.Type.Ammunition[one]"}),
			damage: new foundry.data.fields.SchemaField({
				number: new foundry.data.fields.NumberField({min: 0, integer: true, label: "BF.Die.Number.Label"}),
				denomination: new foundry.data.fields.NumberField({min: 1, integer: true, label: "BF.Die.Denomination.Label"}),
				type: new foundry.data.fields.StringField({label: "BF.Damage.Type.Label"})
			}, {label: "BF.Damage.Label"}),
			range: new foundry.data.fields.SchemaField({
				short: new foundry.data.fields.NumberField({min: 0, step: 0.1, label: "BF.Range.Short.Label"}),
				long: new foundry.data.fields.NumberField({min: 0, step: 0.1, label: "BF.Range.Long.Label"}),
				reach: new foundry.data.fields.NumberField({min: 0, step: 0.1, label: "BF.Reach.Label"}),
				units: new foundry.data.fields.StringField()
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
}
