/**
 * Configuration data for sheet sections.
 *
 * @typedef {object} SheetSectionConfiguration
 * @property {string} id - ID of the section, should be unique per actor type.
 * @property {string} tab - Name of the tab on which this section will appear. Places the section into an object
 *                          for that tab's name within the sheet rendering context.
 * @property {object[]} types - Set of filters for object types that should appear in this section.
 * @property {string} label - Localizable label for the section.
 * @property {object} [options]
 * @property {boolean} [options.autoHide=false] - Should this section be hidden unless it has items?
 */

/**
 * Sections that will appear on actor sheets. They are arrays of objects grouped by actor type.
 * @enum {SheetSectionConfiguration[]}
 */
export const sheetSections = {
	pc: [
		{
			id: "class-features",
			tab: "features",
			types: [{type: "feature", "system.type.category": "class"}],
			label: "BF.Item.Feature.Category.Class[other]"
			// TODO: Create categories for each class when multi-classing is supported
		},
		// {
		// 	id: "talents",
		// 	tab: "features",
		// 	types: [{type: "talent"}],
		// 	label: "BF.Item.Type.Talent[other]"
		// },
		{
			id: "lineage-features",
			tab: "features",
			types: [{type: "feature", "system.type.category": "lineage"}],
			label: "BF.Item.Feature.Category.Lineage[other]"
		},
		{
			id: "heritage-features",
			tab: "features",
			types: [{type: "feature", "system.type.category": "heritage"}],
			label: "BF.Item.Feature.Category.Heritage[other]"
		},
		{
			id: "progression",
			tab: "progression",
			types: [{type: "class"}, {type: "background"}, {type: "heritage"}, {type: "lineage"}]
		}
	]
};
