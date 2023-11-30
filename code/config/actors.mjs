import { LongRestDialog, ShortRestDialog } from "../applications/actor/_module.mjs";
import { localizeConfig } from "../utils/_module.mjs";

/**
 * Possible creature types.
 * @enum {LabeledConfiguration}
 */
export const creatureTypes = {
	aberration: {
		localization: "BF.CreatureType.Type.Aberration.Label"
	},
	beast: {
		localization: "BF.CreatureType.Type.Beast.Label"
	},
	celestial: {
		localization: "BF.CreatureType.Type.Celestial.Label"
	},
	construct: {
		localization: "BF.CreatureType.Type.Construct.Label"
	},
	dragon: {
		localization: "BF.CreatureType.Type.Dragon.Label"
	},
	elemental: {
		localization: "BF.CreatureType.Type.Elemental.Label"
	},
	fey: {
		localization: "BF.CreatureType.Type.Fey.Label"
	},
	fiend: {
		localization: "BF.CreatureType.Type.Fiend.Label"
	},
	giant: {
		localization: "BF.CreatureType.Type.Giant.Label"
	},
	humanoid: {
		localization: "BF.CreatureType.Type.Humanoid.Label"
	},
	monstrosity: {
		localization: "BF.CreatureType.Type.Monstrosity.Label"
	},
	ooze: {
		localization: "BF.CreatureType.Type.Ooze.Label"
	},
	plant: {
		localization: "BF.CreatureType.Type.Plant.Label"
	},
	undead: {
		localization: "BF.CreatureType.Type.Undead.Label"
	}
};
localizeConfig(creatureTypes);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration information for death saves.
 * @type {object}
 */
export const deathSave = {
	target: 10,
	successThreshold: 3,
	failureThreshold: 3
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for luck points.
 * @type {{
 *   costs: {[key: string]: number},
 *   rerollFormula: string,
 *   max: number,
 *   validRollTypes: Set<string>
 * }}
 */
export const luck = {
	costs: {
		bonus: 1,
		reroll: 3
	},
	max: 5,
	rerollFormula: "1d4",
	validRollTypes: new Set(["ability-check", "ability-save", "attack", "skill"])
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
 * Configuration data for a rest type.
 *
 * @typedef {object} RestConfiguration
 * @property {{[key: string]: RestTypeConfiguration}} types - Rest types supported.
 * @property {number} hitPointsRecoveryPercentage - Percentage of hit points recovered during a rest.
 * @property {number} hitDiceRecoveryPercentage - Percentage of hit dice recovered during a rest.
 */

/**
 * Configuration data for a rest type.
 *
 * @typedef {LabeledConfiguration} RestTypeConfiguration
 * @property {string} hint - Localizable hint about the rest.
 * @property {string} resultMessages - Prefix for any result messages. A "Base" message must be provided,
 *                                     with optional "Full", "HitDice", & "HitPoints" variants depending
 *                                     on what resources can be recovered.
 * @property {typeof BaseRestDialog} dialogClass - Dialog used when performing the rest.
 * @property {boolean} [recoverHitPoints=false] - Should hit points be recovered?
 * @property {boolean} [recoverHitDice=false] - Should hit dice be recovered?
 */

/**
 * Types of rests an actor can take.
 * @type {RestConfiguration}
 */
export const rest = {
	types: {
		short: {
			label: "BF.Rest.Type.Short.Label",
			hint: "BF.Rest.Type.Short.Hint",
			resultMessages: "BF.Rest.Result.Short",
			dialogClass: ShortRestDialog
		},
		long: {
			label: "BF.Rest.Type.Long.Label",
			hint: "BF.Rest.Type.Long.Hint",
			resultMessages: "BF.Rest.Result.Long",
			dialogClass: LongRestDialog,
			recoverHitPoints: true,
			recoverHitDice: true
		}
	},
	hitPointsRecoveryPercentage: 1,
	hitDiceRecoveryPercentage: 0.5
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
 * Method that expands a single section into multiple based on actor's data.
 *
 * @callback ExpandSheetSectionCallback
 * @param {BlackFlagActor} actor - Actor whose sheet is being rendered.
 * @param {object} sectionData - Existing data for the section being expanded.
 * @returns {object[]} - Sections that should replace the expanded section.
 */

/**
 * Sections that will appear on actor sheets. They are arrays of objects grouped by actor type.
 * @enum {SheetSectionConfiguration[]}
 */
export const sheetSections = {
	pc: [
		{
			id: "ring-*",
			tab: "spellcasting",
			types: [{type: "spell"}],
			expand: (actor, sectionData) => {
				return Object.entries(CONFIG.BlackFlag.spellRings(true)).map(([number, label]) => {
					const cantrip = number === "0";
					const id = cantrip ? "cantrip" : `ring-${number}`;
					const ring = actor.system.spellcasting.rings[id] ?? {};
					const types = [{type: "spell", "system.ring.base": Number(number)}];
					return foundry.utils.mergeObject(sectionData, {
						id, label, types, options: { autoHide: !ring.max && !cantrip }, ring
					}, {inplace: false});
				});
			}
		},
		{
			id: "equipment",
			tab: "inventory",
			types: [{type: "ammunition"}, {type: "armor"}, {type: "weapon"}],
			label: "BF.Item.Category.Equipment.Label"
		},
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
