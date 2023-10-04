/**
 * Configuration data for luck points.
 * @type {{
 *   costs: {[key: string]: number},
 *   rerollFormula: string,
 *   max: number
 * }}
 */
export const luck = {
	costs: {
		bonus: 1,
		reroll: 3
	},
	max: 5,
	rerollFormula: "1d4"
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Movement types that can be used by actors.
 * @enum {LabeledConfiguration}
 */
export const movementTypes = {
	walk: {
		label: "BF.Movement.Type.Walk"
	},
	climb: {
		label: "BF.Movement.Type.Climb"
	},
	swim: {
		label: "BF.Movement.Type.Swim"
	},
	fly: {
		label: "BF.Movement.Type.Fly"
	},
	burrow: {
		label: "BF.Movement.Type.Burrow"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

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
		{
			id: "talents",
			tab: "features",
			types: [{type: "talent"}],
			label: "BF.Item.Type.Talent[other]"
		},
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

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for creature sizes.
 *
 * @typedef {LabeledConfiguration} SizeConfiguration
 * @property {number|{width: number, height: number}} scale - Default token scale for a creature of this size.
 */

/**
 * Creature sizes defined by the system.
 * @enum {SizeConfiguration}
 */
export const sizes = {
	tiny: {
		label: "BF.Size.Tiny",
		scale: 0.5
	},
	small: {
		label: "BF.Size.Small",
		scale: 1
	},
	medium: {
		label: "BF.Size.Medium",
		scale: 1
	},
	large: {
		label: "BF.Size.Large",
		scale: 2
	},
	huge: {
		label: "BF.Size.Huge",
		scale: 3
	},
	gargantuan: {
		label: "BF.Size.Gargantuan",
		scale: 4
	}
};
