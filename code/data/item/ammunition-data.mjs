import ItemDataModel from "../abstract/item-data-model.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Ammunition items.
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 *
 * @property {number} magicalBonus - Magical bonus added to attack & damage rolls.
 * @property {object} type
 * @property {string} type.category - Ammunition category as defined in `CONFIG.BlackFlag.ammunition`.
 */
export default class AmmunitionData extends ItemDataModel.mixin(
	DescriptionTemplate,
	PhysicalTemplate,
	PropertiesTemplate
) {
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
			magicalBonus: new NumberField({
				integer: true,
				label: "BF.Ammunition.MagicalBonus.Label",
				hint: "BF.Ammunition.MagicalBonus.Hint"
			}),
			type: new SchemaField({
				category: new StringField({ label: "BF.Equipment.Category.Label" })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
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
		this.preparePhysicalLabels();
	}
}
