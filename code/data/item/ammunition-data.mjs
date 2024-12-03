import ItemDataModel from "../abstract/item-data-model.mjs";
import { DamageField } from "../fields/_module.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Ammunition items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 *
 * @property {object} damage
 * @property {DamageField} damage.base - Base ammunition damage.
 * @property {boolean} damage.replace - Does this ammunition's base damage replace the weapon's base damage
 *                                      rather than supplement it?
 * @property {number} magicalBonus - Magical bonus added to attack & damage rolls.
 * @property {object} type
 * @property {string} type.category - Ammunition category as defined in `CONFIG.BlackFlag.ammunition`.
 */
export default class AmmunitionData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	DescriptionTemplate,
	PhysicalTemplate,
	PropertiesTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.AMMUNITION", "BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "ammunition",
				category: "equipment",
				localization: "BF.Item.Type.Ammunition",
				icon: "fa-solid fa-lines-leaning",
				img: "systems/black-flag/artwork/types/ammunition.svg"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			damage: new SchemaField({
				base: new DamageField(),
				replace: new BooleanField()
			}),
			magicalBonus: new NumberField({ integer: true }),
			type: new SchemaField({
				category: new StringField()
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get attackMagicalBonus() {
		return this.magicAvailable ? this.magicalBonus : null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get chatTags() {
		const tags = this.parent.chatTags;
		this.setPhysicalChatTags(tags);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get validCategories() {
		return CONFIG.BlackFlag.ammunition;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.prepareDescription();
		this.preparePhysicalLabels();

		const type = CONFIG.BlackFlag.ammunition.localized[this.type.category];
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
}
