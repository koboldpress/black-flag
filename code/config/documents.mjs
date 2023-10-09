import * as itemSheet from "../applications/item/_module.mjs";

/**
 * Categories of documents that appear in the create menu.
 */
export const _documentCategories = {
	Item: {
		concept: {
			label: "BF.Item.Category.Concept.Label",
			types: ["class", "lineage", "heritage", "background"]
		},
		feature: {
			label: "BF.Item.Category.Feature.Label",
			types: ["feature", "talent"],
			sheet: {
				application: itemSheet.FeatureSheet,
				label: "BF.Sheet.Feature"
			}
		}
	}
};
