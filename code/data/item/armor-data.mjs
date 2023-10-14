import { numberFormat } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";

/**
 * Data definition for Armor items.
 */
export default class ArmorData extends ItemDataModel {

	static get metadata() {
		return {
			type: "armor",
			category: "equipment",
			localization: "BF.Item.Type.Armor",
			icon: "fa-solid fa-shield-halved"
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
				category: new foundry.data.fields.StringField({label: "BF.Equipment.Category.Label"}),
				base: new foundry.data.fields.StringField({label: "BF.Equipment.Base.Label"})
			}),
			price: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({
					nullable: false, initial: 0, min: 0, step: 0.01, label: "BF.Price.Label"
				}),
				denomination: new foundry.data.fields.StringField({
					blank: false, initial: "gp", label: "BF.Currency.Denomination.Label"
				})
			}, {label: "BF.Price.Label"}),
			quantity: new foundry.data.fields.NumberField({
				nullable: false, initial: 1, min: 0, integer: true, label: "BF.Quantity.Label"
			}),
			weight: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({
					nullable: false, initial: 0, min: 0, step: 0.01, label: "BF.Weight.Label"
				}),
				units: new foundry.data.fields.StringField({initial: "pound"})
			}, {label: "BF.Weight.Label"}),
			properties: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				label: "BF.Property.Label[other]"
			}),
			armor: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({min: 0, integer: true}),
				requiredStrength: new foundry.data.fields.NumberField({min: 0, integer: true})
			}),
			overrides: new foundry.data.fields.SchemaField({
				minModifier: new foundry.data.fields.NumberField({required: false, initial: undefined, integer: true}),
				maxModifier: new foundry.data.fields.NumberField({required: false, initial: undefined, integer: true})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Hint displayed in the editing interface (e.g. " + DEX modifier (max 2)").
	 * @type {string}
	 */
	get modifierHint() {
		const maxModifier = this.overrides.maxModifier ?? CONFIG.BlackFlag.armor[this.type.category]?.modifier?.max;
		if ( maxModifier === 0 ) return "";

		const ability = CONFIG.BlackFlag.abilities[CONFIG.BlackFlag.defaultAbilities.armor];
		const hint = game.i18n.format("BF.Armor.Value.ModifierHint", {
			ability: game.i18n.localize(ability.labels.abbreviation).toUpperCase()
		});
		if ( !maxModifier ) return hint;

		return game.i18n.format("BF.Armor.Value.ModifierMax", { hint, max: numberFormat(maxModifier) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get validCategories() {
		return CONFIG.BlackFlag.armor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get validProperties() {
		return CONFIG.BlackFlag.armorProperties;
	}
}
