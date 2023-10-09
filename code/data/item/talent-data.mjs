import ItemDataModel from "../abstract/item-data-model.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import FeatureTemplate from "./templates/feature-template.mjs";

/**
 * Data definition for Talent items.
 */
export default class TalentData extends ItemDataModel.mixin(AdvancementTemplate, FeatureTemplate) {

	static get metadata() {
		return {
			type: "talent",
			localization: "BF.Item.Type.Talent"
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			restriction: new foundry.data.fields.SchemaField({
				allowMultipleTimes: new foundry.data.fields.BooleanField({
					label: "BF.Talent.AllowMultipleTimes.Label", hint: "BF.Talent.AllowMultipleTimes.Hint"
				})
			})
		});
	}
}
