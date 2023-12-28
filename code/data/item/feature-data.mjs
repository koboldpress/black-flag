import ItemDataModel from "../abstract/item-data-model.mjs";
import IdentifierField from "../fields/identifier-field.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import FeatureTemplate from "./templates/feature-template.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Data definition for Feature items.
 * @mixes {ActivitiesTemplate}
 * @mixes {AdvancementTemplate}
 * @mixes {FeatureTemplate}
 */
export default class FeatureData extends ItemDataModel.mixin(ActivitiesTemplate, AdvancementTemplate, FeatureTemplate) {

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
