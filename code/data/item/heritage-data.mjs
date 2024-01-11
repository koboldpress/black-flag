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
			icon: "fa-solid fa-monument",
			img: "systems/black-flag/artwork/types/heritage.svg",
			accentColor: "#aa0000"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_preCreateAdvancement(data, options, user) {
		if ( data._id || foundry.utils.hasProperty(data, "system.advancement") ) return;
		this._createInitialAdvancement([{
			type: "trait", title: "Languages",
			configuration: { grants: ["languages:common"], choices: [{ count: 1, pool: "languages:*" }] }
		}]);
	}
}
