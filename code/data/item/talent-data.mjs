import TalentSheet from "../../applications/item/talent-sheet.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import * as fields from "../fields/_module.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";

/**
 * Data definition for Talent items.
 */
export default class TalentData extends ItemDataModel.mixin(AdvancementTemplate) {

	static get metadata() {
		return {
			type: "talent",
			category: "features",
			localization: "BF.Item.Type.Talent",
			sheet: {
				application: TalentSheet,
				label: "BF.Sheet.Talent"
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
			type: new foundry.data.fields.SchemaField({
				category: new foundry.data.fields.StringField()
			})
			// TODO: Requirements
			// TODO: Whether this talent can be taken multiple times
		});
	}
}
