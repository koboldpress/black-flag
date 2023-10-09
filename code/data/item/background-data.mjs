import ItemDataModel from "../abstract/item-data-model.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";

/**
 * Data definition for Background items.
 */
export default class BackgroundData extends ItemDataModel.mixin(AdvancementTemplate, ConceptTemplate) {
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "background",
			category: "concept",
			localization: "BF.Item.Type.Background",
			accentColor: "#0000aa"
		});
	}
}
