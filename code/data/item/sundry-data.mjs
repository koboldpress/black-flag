import ItemDataModel from "../abstract/item-data-model.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Sundry items.
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 *
 * @property {object} type
 * @property {string} type.category - Sundry category as defined in `CONFIG.BlackFlag.sundryCategories`.
 * @property {string} type.base - Specific sundry type defined as a child of its category.
 */
export default class SundryData extends ItemDataModel.mixin(DescriptionTemplate, PhysicalTemplate) {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "sundry",
				category: "equipment",
				localization: "BF.Item.Type.Sundry",
				icon: "fa-solid fa-boxes-stacked",
				img: "systems/black-flag/artwork/types/sundry.svg"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			type: new SchemaField({
				category: new StringField({ label: "BF.Equipment.Category.Label" }),
				base: new StringField({ label: "BF.Equipment.Base.Label" })
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
		return CONFIG.BlackFlag.sundryCategories;
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
