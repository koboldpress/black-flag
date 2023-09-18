import ConceptTemplate from "./templates/concept-template.mjs";

/**
 * Data definition for Background items.
 */
export default class HeritageData extends ConceptTemplate {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "heritage",
			localization: "BF.Item.Type.Heritage"
		});
	}
}
