import ItemDataModel from "../abstract/item-data-model.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";

/**
 * Data definition for Background items.
 * @mixes {AdvancementTemplate}
 * @mixes {ConceptTemplate}
 * @mixes {DescriptionTemplate}
 */
export default class HeritageData extends ItemDataModel.mixin(
	AdvancementTemplate, ConceptTemplate, DescriptionTemplate
) {

	/** @inheritDoc */
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
			configuration: { grants: ["languages:standard:common"], choices: [{ count: 1, pool: "languages:*" }] }
		}]);
	}
}
