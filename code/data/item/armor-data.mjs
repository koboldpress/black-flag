import { numberFormat } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import ProficiencyTemplate from "./templates/proficiency-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Armor items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {ProficiencyTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 *
 * @property {object} armor
 * @property {number} armor.value - Base armor class offered by this item.
 * @property {number} armor.requiredStrength - Strength score required to wear this armor.
 * @property {number} magicalBonus - Magical bonus added to armor class.
 * @property {object} modifier
 * @property {number} modifier.min - Minimum amount of modifier ability (usually DEX) that is contributed to AC.
 * @property {number} modifier.max - Maximum amount of modifier ability (usually DEX) that is contributed to AC.
 * @property {object} type
 * @property {string} type.category - Armor category as defined in `CONFIG.BlackFlag.armor`.
 * @property {string} type.base - Specific armor type defined as a child of its category.
 */
export default class ArmorData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	DescriptionTemplate,
	ProficiencyTemplate,
	PhysicalTemplate,
	PropertiesTemplate
) {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "armor",
				category: "equipment",
				localization: "BF.Item.Type.Armor",
				icon: "fa-solid fa-shield-halved",
				img: "systems/black-flag/artwork/types/armor.svg"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			armor: new SchemaField({
				value: new NumberField({ min: 0, integer: true, label: "BF.Armor.Value.Label" }),
				requiredStrength: new NumberField({
					min: 0,
					integer: true,
					label: "BF.Armor.RequiredStrength.Label"
				})
			}),
			magicalBonus: new NumberField({
				integer: true,
				label: "BF.Armor.MagicalBonus.Label",
				hint: "BF.Armor.MagicalBonus.Hint"
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
			}),
			type: new SchemaField({
				category: new StringField({ label: "BF.Equipment.Category.Label" }),
				base: new StringField({ label: "BF.Equipment.Base.Label" })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Label for the final AC value.
	 * @type {string}
	 */
	get acLabel() {
		let label;
		if (this.type.category === "shield") label = numberFormat(this._source.armor.value || 2, { sign: true });
		else
			label = `${game.i18n.localize("BF.ArmorClass.Abbreviation")}: ${numberFormat(
				this._source.armor.value || 0
			)} ${this.modifierHint(false)}`;
		if (this.magicAvailable && this.magicalBonus) label += ` + ${numberFormat(this.magicalBonus)}`;
		return label.trim();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get chatTags() {
		const tags = this.parent.chatTags;
		if (this.type.category) tags.set("type", CONFIG.BlackFlag.armor.localized[this.type.category]);
		tags.set("details", this.acLabel);
		this.setPhysicalChatTags(tags);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static proficiencyCategory = "armor";

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get traits() {
		const traits = [
			this.acLabel,
			...Array.from(this.properties).map(p => CONFIG.BlackFlag.itemProperties.localized[p])
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

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();
		this.armor.value = this._source.armor.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();

		this.prepareEquippedArmor();
		this.preparePhysicalLabels();

		if (!this.armor.value && this.type.category === "shield") this.armor.value = 2;
		if (this.magicAvailable && this.magicalBonus) this.armor.value += this.magicalBonus;

		const armorConfig = CONFIG.BlackFlag.armor[this.type.category]?.modifier;
		if (armorConfig) {
			this.modifier.min ??= armorConfig.min;
			this.modifier.max ??= armorConfig.max;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare equipped armor and add error if too many armor or shields are equipped.
	 */
	prepareEquippedArmor() {
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

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();

		const rollData = this.parent.getRollData({ deterministic: true });
		this.prepareFinalActivities(rollData);

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
