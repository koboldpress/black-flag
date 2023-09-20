import ConceptTemplate from "./templates/concept-template.mjs";

/**
 * Data definition for Background items.
 */
export default class BackgroundData extends ConceptTemplate {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "background",
			category: "concept",
			localization: "BF.Item.Type.Background"
		});
	}
}
