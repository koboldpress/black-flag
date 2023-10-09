import FeatureSheet from "../../applications/item/feature-sheet.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import * as fields from "../fields/_module.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";

/**
 * Data definition for Feature items.
 */
export default class FeatureData extends ItemDataModel.mixin(AdvancementTemplate) {

	static get metadata() {
		return {
			type: "feature",
			category: "features",
			localization: "BF.Item.Type.Feature",
			sheet: {
				application: FeatureSheet,
				label: "BF.Sheet.Feature"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			advancement: new fields.AdvancementField(),
			description: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new foundry.data.fields.StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			identifier: new foundry.data.fields.SchemaField({
				class: new fields.IdentifierField()
			}),
			level: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({min: 0, integer: true})
			}),
			type: new foundry.data.fields.SchemaField({
				category: new foundry.data.fields.StringField(),
				value: new foundry.data.fields.StringField()
			})
		});
	}
}
