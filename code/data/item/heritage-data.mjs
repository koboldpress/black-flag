import ItemDataModel from "../abstract/item-data-model.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";

/**
 * Data definition for Background items.
 */
export default class HeritageData extends ItemDataModel.mixin(AdvancementTemplate, ConceptTemplate) {
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "heritage",
			category: "concept",
			localization: "BF.Item.Type.Heritage",
			accentColor: "#aa0000"
		});
	}
}
