import ItemDataModel from "../abstract/item-data-model.mjs";
import { IdentifierField } from "../fields/_module.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import FeatureTemplate from "./templates/feature-template.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

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
			identifier: new SchemaField({
				class: new IdentifierField()
			}),
			level: new SchemaField({
				value: new NumberField({min: 0, integer: true})
			})
		});
	}
}
