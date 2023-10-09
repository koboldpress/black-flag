import ItemDataModel from "../abstract/item-data-model.mjs";
import * as fields from "../fields/_module.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import FeatureTemplate from "./templates/feature-template.mjs";

/**
 * Data definition for Feature items.
 */
export default class FeatureData extends ItemDataModel.mixin(AdvancementTemplate, FeatureTemplate) {

	static get metadata() {
		return {
			type: "feature",
			localization: "BF.Item.Type.Feature"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			identifier: new foundry.data.fields.SchemaField({
				class: new fields.IdentifierField()
			}),
			level: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({min: 0, integer: true})
			})
		});
	}
}
