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
			icon: "fa-solid fa-globe",
			img: "systems/black-flag/artwork/types/lineage.svg",
			accentColor: "#00aa00"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_preCreateAdvancement(data, options, user) {
		if ( data._id || foundry.utils.hasProperty(data, "system.advancement") ) return;
		this._createInitialAdvancement([{ type: "size" }]);
	}
}
