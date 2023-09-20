import ConceptTemplate from "./templates/concept-template.mjs";

/**
 * Data definition for Lineage items.
 */
export default class LineageData extends ConceptTemplate {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "lineage",
			category: "concept",
			localization: "BF.Item.Type.Lineage"
		});
	}
}
