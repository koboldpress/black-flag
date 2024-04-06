import { numberFormat } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import ProficiencyTemplate from "./templates/proficiency-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Armor items.
 * @mixes {DescriptionTemplate}
 * @mixes {ProficiencyTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 */
export default class ArmorData extends ItemDataModel.mixin(
	DescriptionTemplate,
	ProficiencyTemplate,
	PhysicalTemplate,
	PropertiesTemplate
) {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "armor",
			category: "equipment",
			localization: "BF.Item.Type.Armor",
			icon: "fa-solid fa-shield-halved",
			img: "systems/black-flag/artwork/types/armor.svg"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			type: new SchemaField({
				category: new StringField({ label: "BF.Equipment.Category.Label" }),
				base: new StringField({ label: "BF.Equipment.Base.Label" })
			}),
			properties: new SetField(new StringField(), {
				label: "BF.Property.Label[other]"
			}),
			armor: new SchemaField({
				value: new NumberField({ min: 0, integer: true, label: "BF.Armor.Value.Label" }),
				requiredStrength: new NumberField({
					min: 0,
					integer: true,
					label: "BF.Armor.RequiredStrength.Label"
				})
			}),
			modifier: new SchemaField({
				min: new NumberField({
					required: false,
					initial: undefined,
					integer: true,
					label: "BF.Armor.Modifier.Minimum.Label"
				}),
				max: new NumberField({
					required: false,
					initial: undefined,
					integer: true,
					label: "BF.Armor.Modifier.Maximum.Label"
				})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static proficiencyCategory = "armor";

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get traits() {
		const traits = [
			this.type.category === "shield"
				? `+${numberFormat(this.armor.value)}`
				: `${game.i18n.localize("BF.ArmorClass.Abbreviation")}: ${numberFormat(
						this.armor.value
					)} ${this.modifierHint(false)}`,
			...Array.from(this.properties).map(p => this.validProperties[p]?.label)
		];
		// TODO: Display required strength with cumbersome property
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit" });
		return listFormatter.format(traits.filter(t => t).map(t => game.i18n.localize(t)));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get validCategories() {
		return CONFIG.BlackFlag.armor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedArmorValue() {
		if (!this.armor.value && this.type.category === "shield") {
			this.armor.value = 2;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedEquipArmor() {
		const ac = this.parent.actor?.system.attributes?.ac;
		if (!ac || !this.equipped) return;

		const target = this.type.category === "shield" ? "equippedShield" : "equippedArmor";
		if (ac[target]) {
			if (ac[target] === this.parent) return;
			this.parent.actor.notifications.set(`armor-${this.parent.id}-equipped`, {
				level: "warn",
				category: "armor-class",
				section: "inventory",
				document: this.parent.id,
				message: game.i18n.format("BF.Armor.Notification.TooMany", {
					type: game.i18n
						.localize(`BF.Armor.${this.type.category === "shield" ? "Category.Shield" : "Label"}[one]`)
						.toLowerCase()
				})
			});
			return;
		}

		Object.defineProperty(ac, target, {
			value: this.parent,
			configurable: true,
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedModifiers() {
		const armorConfig = CONFIG.BlackFlag.armor[this.type.category]?.modifier;
		if (!armorConfig) return;
		this.modifier.min ??= armorConfig.min;
		this.modifier.max ??= armorConfig.max;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalProficiencyWarnings() {
		if (!this.equipped) return;
		if (this.proficient === false) {
			const message = game.i18n.format("BF.Armor.Notification.NotProficient", {
				type: game.i18n
					.localize(`BF.Armor.${this.type.category === "shield" ? "Category.Shield" : "Label"}[one]`)
					.toLowerCase()
			});
			this.parent.actor.notifications.set(`armor-${this.parent.id}-proficiency`, {
				label: "info",
				document: this.parent.id,
				message
			});
			this.parent.actor.system.modifiers.push({
				type: "note",
				filter: [
					{ k: "type", v: "ability-check" },
					{
						o: "OR",
						v: [
							{ k: "ability", v: "strength" },
							{ k: "ability", v: "dexterity" }
						]
					}
				],
				note: {
					rollMode: CONFIG.Dice.ChallengeDie.MODES.DISADVANTAGE,
					text: game.i18n.format("BF.Armor.Notification.NotProficientNote", { name: this.parent.name })
				}
			});
		}
		if (this.properties.has("noisy")) {
			this.parent.actor.system.modifiers.push({
				type: "note",
				filter: [
					{ k: "type", v: "skill-check" },
					{ k: "skill", v: "stealth" }
				],
				note: {
					rollMode: CONFIG.Dice.ChallengeDie.MODES.DISADVANTAGE,
					text: game.i18n.localize("BF.Armor.Notification.Noisy")
				}
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Hint displayed in the editing interface (e.g. " + DEX modifier (max 2)").
	 * @param {boolean} [long=true] - Use the long format?
	 * @returns {string}
	 */
	modifierHint(long = true) {
		if (this.modifier.max === 0) return "";

		const ability = CONFIG.BlackFlag.abilities[CONFIG.BlackFlag.defaultAbilities.armor];
		const hint = game.i18n.format(`BF.Armor.Modifier.Description.${long ? "Long" : "Short"}`, {
			ability: game.i18n.localize(ability.labels.abbreviation).toUpperCase()
		});
		if (!this.modifier.max) return hint;

		return game.i18n.format("BF.Armor.Modifier.Description.Max", { hint, max: numberFormat(this.modifier.max) });
	}
}
