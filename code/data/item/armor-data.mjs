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
			modifier: new foundry.data.fields.SchemaField({
				min: new foundry.data.fields.NumberField({
					required: false, initial: undefined, integer: true, label: "BF.Armor.Modifier.Minimum.Label"
				}),
				max: new foundry.data.fields.NumberField({
					required: false, initial: undefined, integer: true, label: "BF.Armor.Modifier.Maximum.Label"
				})
			})
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
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedArmorValue() {
		if ( !this.armor.value && (this.type.category === "shield") ) {
			this.armor.value = 2;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedEquipArmor() {
		const ac = this.parent.actor?.system.attributes?.ac;
		if ( !ac || !this.equipped ) return;

		const target = this.type.category === "shield" ? "equippedShield" : "equippedArmor";
		if ( ac[target] ) {
			if ( ac[target] === this.parent ) return;
			this.parent.actor.notifications.set(`armor-${this.parent.id}-equipped`, {
				level: "warn", category: "armor-class", section: "inventory", document: this.parent.id,
				message: game.i18n.format("BF.Armor.Warning.TooMany", {
					type: game.i18n.localize(`BF.Armor.${this.type.category === "shield" ? "Category.Shield" : "Label"}[one]`)
				})
			});
			return;
		}

		Object.defineProperty(ac, target, {
			value: this.parent,
			configurable: true,
			enumerable: false
		});

		// TODO: Add roll notes if wearing armor you aren't proficient in
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedModifiers() {
		const armorConfig = CONFIG.BlackFlag.armor[this.type.category]?.modifier;
		if ( !armorConfig ) return;
		this.modifier.min ??= armorConfig.min;
		this.modifier.max ??= armorConfig.max;
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
		if ( this.modifier.maxModifier === 0 ) return "";

		const ability = CONFIG.BlackFlag.abilities[CONFIG.BlackFlag.defaultAbilities.armor];
		const hint = game.i18n.format(`BF.Armor.Modifier.Description.${long ? "Long" : "Short"}`, {
			ability: game.i18n.localize(ability.labels.abbreviation).toUpperCase()
		});
		if ( !this.modifier.maxModifier ) return hint;

		return game.i18n.format("BF.Armor.Modifier.Description.Max", { hint, max: numberFormat(this.modifier.maxModifier) });
	}
}
