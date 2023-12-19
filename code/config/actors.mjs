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
 * @property {string[]} [recoverPeriods] - Recovery periods as defined in `CONFIG.BlackFlag.recoveryPeriods` that
 *                                         should be applied when this rest is taken.
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
			dialogClass: ShortRestDialog,
			recoverPeriods: ["shortRest"]
		},
		long: {
			label: "BF.Rest.Type.Long.Label",
			hint: "BF.Rest.Type.Long.Hint",
			resultMessages: "BF.Rest.Result.Long",
			dialogClass: LongRestDialog,
			recoverHitPoints: true,
			recoverHitDice: true,
			recoverPeriods: ["longRest", "shortRest"]
		}
	},
	hitPointsRecoveryPercentage: 1,
	hitDiceRecoveryPercentage: 0.5
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Sense types that can be used by actors.
 * @enum {LabeledConfiguration}
 */
export const senses = {
	darkvision: {
		label: "BF.Senses.Type.Darkvision"
	},
	keensense: {
		label: "BF.Senses.Type.Keensense"
	},
	tremorsense: {
		label: "BF.Senses.Type.Tremorsense"
	},
	truesight: {
		label: "BF.Senses.Type.Truesight"
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
 * @property {string} label - Localizable label for the section.
 * @property {FilterDescription[]} filters - Set of filters to determine which items should appear in this section.
 * @property {object[]} [create] - Data used when creating items within this section, with an optional `label`.
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
			filters: [
				{k: "type", v: "spell"},
				{k: "flags.black-flag.relationship.preparationMode", o: "in", v: ["standard", "alwaysPrepared", undefined]}
			],
			expand: (actor, sectionData) => {
				return Object.entries(CONFIG.BlackFlag.spellRings(true)).map(([number, label]) => {
					number = Number(number);
					const cantrip = number === 0;
					const id = cantrip ? "cantrip" : `ring-${number}`;
					const ring = actor.system.spellcasting.rings[id] ?? {};
					return foundry.utils.mergeObject(sectionData, {
						id, label,
						filters: [...sectionData.filters, {k: "system.ring.base", v: number}],
						create: [{
							type: "spell",
							"system.ring.base": number,
							"flags.black-flag.relationship.preparationMode": "standard"
						}],
						options: { autoHide: !ring.max && !cantrip }, ring
					}, {inplace: false});
				});
			}
		},
		{
			id: "ritual",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.Ritual",
			filters: [{k: "type", v: "spell"}, {k: "flags.black-flag.relationship.preparationMode", v: "ritual"}],
			create: [{type: "spell", "flags.black-flag.relationship.preparationMode": "ritual"}],
			options: {autoHide: true}
		},
		{
			id: "innate",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.Innate",
			filters: [{k: "type", v: "spell"}, {k: "flags.black-flag.relationship.preparationMode", v: "innate"}],
			create: [{type: "spell", "flags.black-flag.relationship.preparationMode": "innate"}],
			options: {autoHide: true}
		},
		{
			id: "equipment",
			tab: "inventory",
			label: "BF.Item.Category.Equipment.Label",
			filters: [{k: "type", o: "in", v: ["armor", "weapon", "ammunition"]}],
			create: [{type: "armor"}, {type: "weapon"}, {type: "ammunition"}]
		},
		{
			id: "class-features",
			tab: "features",
			label: "BF.Item.Feature.Category.Class[other]",
			filters: [{k: "type", v: "feature"}, {k: "system.type.category", v: "class"}],
			expand: (actor, sectionData) => {
				if ( actor.system.progression.level === 0 ) return sectionData;
				return Object.entries(actor.system.progression.classes).map(([identifier, cls]) => {
					const label = pluralRule => game.i18n.format(
						`BF.Item.Feature.Category.ClassSpecific[${pluralRule}]`, { class: cls.document.name }
					);
					return foundry.utils.mergeObject(sectionData, {
						id: `class-${identifier}`, label: label("other"),
						filters: [...sectionData.filters, {k: "system.identifier.associated", v: identifier}],
						create: [{
							label: label("one"),
							type: "feature",
							"system.type.category": "class",
							"system.identifier.associated": identifier
						}],
						levels: cls.levels
					}, {inplace: false});
				}).sort((lhs, rhs) => rhs.levels - lhs.levels);
			}
		},
		{
			id: "talents",
			tab: "features",
			label: "BF.Item.Type.Talent[other]",
			filters: [{k: "type", v: "talent"}],
			create: [{type: "talent"}]
		},
		{
			id: "lineage-features",
			tab: "features",
			label: "BF.Item.Feature.Category.Lineage[other]",
			filters: [{k: "type", v: "feature"}, {k: "system.type.category", v: "lineage"}],
			create: [{label: "BF.Item.Feature.Category.Lineage[one]", type: "feature", "system.type.category": "lineage"}]
		},
		{
			id: "heritage-features",
			tab: "features",
			label: "BF.Item.Feature.Category.Heritage[other]",
			filters: [{k: "type", v: "feature"}, {k: "system.type.category", v: "heritage"}],
			create: [{label: "BF.Item.Feature.Category.Heritage[one]", type: "feature", "system.type.category": "heritage"}]
		},
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: [{k: "type", v: "feature"}],
			create: [{type: "feature"}],
			options: {autoHide: true}
		},
		{
			id: "progression",
			tab: "progression",
			filters: [{k: "type", o: "in", v: ["class", "background", "heritage", "lineage"]}]
		}
	],
	npc: [
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: [{k: "type", o: "in", v: ["feature", "talent"]}],
			create: [{type: "feature"}]
		},
		{
			id: "equipment",
			tab: "features",
			label: "BF.Item.Category.Equipment.Label",
			filters: [{k: "type", o: "in", v: ["ammunition", "armor", "weapon"]}],
			create: [{type: "armor"}, {type: "weapon"}, {type: "ammunition"}]
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

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Table for XP values for each CR.
 * @type {number[]}
 */
export const xpForCR = [
	10,      // CR 0
	25,      // CR ⅛
	50,      // CR ¼
	100,     // CR ½
	200,     // CR 1
	450,     // CR 2
	700,     // CR 3
	1100,    // CR 4
	1800,    // CR 5
	2300,    // CR 6
	2900,    // CR 7
	3900,    // CR 8
	5000,    // CR 9
	5900,    // CR 10
	7200,    // CR 11
	8400,    // CR 12
	10000,   // CR 13
	11500,   // CR 14
	13000,   // CR 15
	15000,   // CR 16
	18000,   // CR 17
	20000,   // CR 18
	22000,   // CR 19
	25000,   // CR 20
	33000,   // CR 21
	41000,   // CR 22
	50000,   // CR 23
	62000,   // CR 24
	75000,   // CR 25
	90000,   // CR 26
	105000,  // CR 27
	120000,  // CR 28
	135000,  // CR 29
	155000   // CR 30
];
