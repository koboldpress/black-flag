import ItemDataModel from "../abstract/item-data-model.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Ammunition items.
 * @mixes {DescriptionTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 *
 * @property {object} type
 * @property {string} type.category - Ammunition category as defined in `CONFIG.BlackFlag.ammunition`.
 */
export default class AmmunitionData extends ItemDataModel.mixin(
	DescriptionTemplate,
	PhysicalTemplate,
	PropertiesTemplate
) {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "ammunition",
			category: "equipment",
			localization: "BF.Item.Type.Ammunition",
			icon: "fa-solid fa-lines-leaning",
			img: "systems/black-flag/artwork/types/ammunition.svg"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			type: new SchemaField({
				category: new StringField({ label: "BF.Equipment.Category.Label" })
			})
			// TODO: Damage bonuses
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get validCategories() {
		return CONFIG.BlackFlag.ammunition;
	}
}
