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
		return foundry.utils.mergeObject(super.metadata, {
			type: "feature",
			localization: "BF.Item.Type.Feature"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			identifier: new SchemaField({
				associated: new IdentifierField()
			}),
			level: new SchemaField({
				value: new NumberField({min: 0, integer: true})
			})
		});
	}
}
