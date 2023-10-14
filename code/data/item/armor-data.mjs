import { numberFormat } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

/**
 * Data definition for Armor items.
 * @mixes PhysicalTemplate
 */
export default class ArmorData extends ItemDataModel.mixin(PhysicalTemplate) {

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
			properties: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				label: "BF.Property.Label[other]"
			}),
			armor: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({min: 0, integer: true, label: "BF.Armor.Value.Label"}),
				requiredStrength: new foundry.data.fields.NumberField({
					min: 0, integer: true, label: "BF.Armor.RequiredStrength.Label"
				})
			}),
			overrides: new foundry.data.fields.SchemaField({
				minModifier: new foundry.data.fields.NumberField({
					required: false, initial: undefined, integer: true, label: "BF.Armor.Modifier.Minimum.Label"
				}),
				maxModifier: new foundry.data.fields.NumberField({
					required: false, initial: undefined, integer: true, label: "BF.Armor.Modifier.Maximum.Label"
				})
			}, {label: "BF.Override.Label[other]"})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get traits() {
		const traits = [
			this.type.category === "shield"
				? `+${numberFormat(this.armor.value)}`
				: `${game.i18n.localize("BF.ArmorClass.Abbreviation")}: ${
					numberFormat(this.armor.value)} ${this.modifierHint(false)}`,
			...this.properties.map(p => this.validProperties[p]?.label)
		];
		// TODO: Display required strength with cumbersome property
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit" });
		return listFormatter.format(traits.filter(t => t).map(t => game.i18n.localize(t)));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get validCategories() {
		return CONFIG.BlackFlag.armor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get validProperties() {
		return CONFIG.BlackFlag.armorProperties;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Hint displayed in the editing interface (e.g. " + DEX modifier (max 2)").
	 * @param {boolean} [long=true] - Use the long format?
	 * @returns {string}
	 */
	modifierHint(long=true) {
		const maxModifier = this.overrides.maxModifier ?? CONFIG.BlackFlag.armor[this.type.category]?.modifier?.max;
		if ( maxModifier === 0 ) return "";

		const ability = CONFIG.BlackFlag.abilities[CONFIG.BlackFlag.defaultAbilities.armor];
		const hint = game.i18n.format(`BF.Armor.Modifier.Description.${long ? "Long" : "Short"}`, {
			ability: game.i18n.localize(ability.labels.abbreviation).toUpperCase()
		});
		if ( !maxModifier ) return hint;

		return game.i18n.format("BF.Armor.Modifier.Description.Max", { hint, max: numberFormat(maxModifier) });
	}
}
