import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Tool items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 */
export default class ToolData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	DescriptionTemplate,
	PhysicalTemplate,
	PropertiesTemplate
) {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "tool",
			category: "equipment",
			localization: "BF.Item.Type.Tool",
			icon: "fa-solid fa-screwdriver-wrench",
			img: "systems/black-flag/artwork/types/tool.svg"
		};
	}

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
	get validCategories() {
		return CONFIG.BlackFlag.tools;
	}
}
