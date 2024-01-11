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
			icon: "fa-solid fa-person-digging",
			img: "systems/black-flag/artwork/types/background.svg",
			accentColor: "#0000aa"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_preCreateAdvancement(data, options, user) {
		if ( data._id || foundry.utils.hasProperty(data, "system.advancement") ) return;
		this._createInitialAdvancement([
			{ type: "trait", title: "Skill Proficiencies", configuration: { choices: [{ count: 2, pool: "skills:*" }] } },
			{ type: "trait", title: "Additional Proficiencies" },
			{ type: "chooseFeatures", title: "Talent", configuration: {
				choices: { 0: 1 }, allowDrops: false, type: "talent"
			} }
		]);
	}
}
