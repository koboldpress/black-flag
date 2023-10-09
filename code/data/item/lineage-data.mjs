import ItemDataModel from "../abstract/item-data-model.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";

/**
 * Data definition for Lineage items.
 */
export default class LineageData extends ItemDataModel.mixin(AdvancementTemplate, ConceptTemplate) {
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "lineage",
			category: "concept",
			localization: "BF.Item.Type.Lineage",
			accentColor: "#00aa00"
		});
	}
}
