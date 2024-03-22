import ItemDataModel from "../abstract/item-data-model.mjs";
import UsesField from "../fields/uses-field.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";

const { BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Consumable items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 */
export default class ConsumableData extends ItemDataModel.mixin(
	ActivitiesTemplate, DescriptionTemplate, PhysicalTemplate
) {

	/** @inheritDoc */
	static get metadata() {
		return {
			type: "consumable",
			category: "equipment",
			localization: "BF.Item.Type.Consumable",
			icon: "fa-solid fa-bottle-droplet",
			img: "systems/black-flag/artwork/types/consumable.svg"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			type: new SchemaField({
				category: new StringField({label: "BF.Equipment.Category.Label"})
			}),
			uses: new UsesField({
				consumeQuantity: new BooleanField({initial: true})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get validCategories() {
		return CONFIG.BlackFlag.consumableCategories;
	}
}
