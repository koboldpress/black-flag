import { LongRestDialog, ShortRestDialog } from "../applications/actor/_module.mjs";
import { localizeConfig } from "../utils/_module.mjs";

/**
 * Possible creature types.
 * @enum {LabeledConfiguration}
 */
export const creatureTypes = {
	aberration: {
		localization: "BF.CreatureType.Type.Aberration"
	},
	beast: {
		localization: "BF.CreatureType.Type.Beast"
	},
	celestial: {
		localization: "BF.CreatureType.Type.Celestial"
	},
	construct: {
		localization: "BF.CreatureType.Type.Construct"
	},
	dragon: {
		localization: "BF.CreatureType.Type.Dragon"
	},
	elemental: {
		localization: "BF.CreatureType.Type.Elemental"
	},
	fey: {
		localization: "BF.CreatureType.Type.Fey"
	},
	fiend: {
		localization: "BF.CreatureType.Type.Fiend"
	},
	giant: {
		localization: "BF.CreatureType.Type.Giant"
	},
	humanoid: {
		localization: "BF.CreatureType.Type.Humanoid"
	},
	monstrosity: {
		localization: "BF.CreatureType.Type.Monstrosity"
	},
	ooze: {
		localization: "BF.CreatureType.Type.Ooze"
	},
	plant: {
		localization: "BF.CreatureType.Type.Plant"
	},
	undead: {
		localization: "BF.CreatureType.Type.Undead"
	}
};
localizeConfig(creatureTypes);
localizeConfig(creatureTypes, { propertyName: "localizedPlural", pluralRule: "other" });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Tags that can be associated with creature types.
 * @enum {NestedTypeConfiguration}
 */
export const creatureTags = {
	animal: {
		localization: "BF.CreatureType.Tag.Animal"
	},
	golem: {
		localization: "BF.CreatureType.Tag.Golem"
	},
	outsider: {
		localization: "BF.CreatureType.Tag.Outsider",
		children: {
			angel: {
				localization: "BF.CreatureType.Tag.Angel"
			},
			demon: {
				localization: "BF.CreatureType.Tag.Demon"
			},
			devil: {
				localization: "BF.CreatureType.Tag.Devil"
			}
		}
	},
	shapechanger: {
		localization: "BF.CreatureType.Tag.Shapechanger",
		children: {
			lycanthrope: {
				localization: "BF.CreatureType.Tag.Lycanthrope"
			}
		}
	},
	anyLineage: {
		label: "BF.CreatureType.Tag.AnyLineage"
	}
};
localizeConfig(creatureTags, { flatten: true });

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
/*                       Movement                        */
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
	fly: {
		label: "BF.Movement.Type.Fly"
	},
	swim: {
		label: "BF.Movement.Type.Swim"
	},
	burrow: {
		label: "BF.Movement.Type.Burrow"
	}
};
localizeConfig(movementTypes);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Tags the describe additional details of a character's movement.
 * @enum {TraitTagConfiguration}
 */
export const movementTags = {
	hover: {
		label: "BF.Movement.Tag.Hover.Label",
		display: "BF.Movement.Tag.Hover.Display",
		type: "associated",
		association: "fly"
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
 * @property {boolean} [recoverLeveledSpellSlots=false] - Should regular spell slots be recovered?
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
			recoverLeveledSpellSlots: true,
			recoverPeriods: ["longRest", "shortRest"]
		}
	},
	hitPointsRecoveryPercentage: 1,
	hitDiceRecoveryPercentage: 0.5
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                        Senses                         */
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
localizeConfig(senses);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Tags the describe additional details of a character's senses.
 * @enum {TraitTagConfiguration}
 */
export const senseTags = {
	cantSense: {
		label: "BF.Senses.Tag.CantSense.Label",
		display: "BF.Senses.Tag.CantSense.Display",
		type: "associated",
		association: "keensense"
	}
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
	10, // CR 0
	25, // CR ⅛
	50, // CR ¼
	100, // CR ½
	200, // CR 1
	450, // CR 2
	700, // CR 3
	1100, // CR 4
	1800, // CR 5
	2300, // CR 6
	2900, // CR 7
	3900, // CR 8
	5000, // CR 9
	5900, // CR 10
	7200, // CR 11
	8400, // CR 12
	10000, // CR 13
	11500, // CR 14
	13000, // CR 15
	15000, // CR 16
	18000, // CR 17
	20000, // CR 18
	22000, // CR 19
	25000, // CR 20
	33000, // CR 21
	41000, // CR 22
	50000, // CR 23
	62000, // CR 24
	75000, // CR 25
	90000, // CR 26
	105000, // CR 27
	120000, // CR 28
	135000, // CR 29
	155000 // CR 30
];
