import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Gear items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 *
 * @property {object} type
 * @property {string} type.category - Gear category as defined in `CONFIG.BlackFlag.gearCategories`.
 * @property {string} type.base - Specific gear type defined as a child of its category.
 */
export default class GearData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	DescriptionTemplate,
	PhysicalTemplate,
	PropertiesTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "gear",
				category: "equipment",
				localization: "BF.Item.Type.Gear",
				icon: "fa-solid fa-wand-magic",
				img: "systems/black-flag/artwork/types/gear.svg"
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
		return CONFIG.BlackFlag.gearCategories;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.prepareDescription();
		this.preparePhysicalLabels();
		this.type.label = CONFIG.BlackFlag.gearCategories.localized[this.type.category] ?? "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();
		const rollData = this.parent.getRollData({ deterministic: true });
		this.prepareFinalActivities(rollData);
	}
}
