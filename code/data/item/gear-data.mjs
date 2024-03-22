import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Gear items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 */
export default class GearData extends ItemDataModel.mixin(ActivitiesTemplate, DescriptionTemplate, PhysicalTemplate) {

	/** @inheritDoc */
	static get metadata() {
		return {
			type: "gear",
			category: "equipment",
			localization: "BF.Item.Type.Gear",
			icon: "fa-solid fa-wand-magic",
			img: "systems/black-flag/artwork/types/gear.svg"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			type: new SchemaField({
				category: new StringField({label: "BF.Equipment.Category.Label"}),
				base: new StringField({label: "BF.Equipment.Base.Label"})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get validCategories() {
		return CONFIG.BlackFlag.gearCategories;
	}
}
