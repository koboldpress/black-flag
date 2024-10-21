import { LongRestDialog, ShortRestDialog } from "../applications/actor/_module.mjs";
import { localizeConfig } from "../utils/_module.mjs";

/**
 * Configuration data for creature types.
 *
 * @typedef {LabeledConfiguration} CreatureTypeConfiguration
 * @property {string} [reference] - UUID of a journal entry with details on this creature type.
 */

/**
 * Possible creature types.
 * @enum {CreatureTypeConfiguration}
 */
export const creatureTypes = {
	aberration: {
		localization: "BF.CreatureType.Type.Aberration",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.FdTfsFN2mEaH0dh0"
	},
	beast: {
		localization: "BF.CreatureType.Type.Beast",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.4CRbAERqSRQQ8rWM"
	},
	celestial: {
		localization: "BF.CreatureType.Type.Celestial",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.YihanG6MWJtWuXRH"
	},
	construct: {
		localization: "BF.CreatureType.Type.Construct",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.bU3uHbUTyEKCvMdw"
	},
	dragon: {
		localization: "BF.CreatureType.Type.Dragon",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.a3m05Htjwsr81ciO"
	},
	elemental: {
		localization: "BF.CreatureType.Type.Elemental",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.KuitTyCuiyPJx7Yx"
	},
	fey: {
		localization: "BF.CreatureType.Type.Fey",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.GUU2PMiIVdkj302g"
	},
	fiend: {
		localization: "BF.CreatureType.Type.Fiend",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.SuJnNFNcErG2SWlu"
	},
	giant: {
		localization: "BF.CreatureType.Type.Giant",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.CU2Aok5lj6Srf6p5"
	},
	humanoid: {
		localization: "BF.CreatureType.Type.Humanoid",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.q74G8dHvaT2iSKiR"
	},
	monstrosity: {
		localization: "BF.CreatureType.Type.Monstrosity",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.UIu4g5LNxbDlh1xl"
	},
	ooze: {
		localization: "BF.CreatureType.Type.Ooze",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ADqhMsVaa0L9DF7h"
	},
	plant: {
		localization: "BF.CreatureType.Type.Plant",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.aIRHqfydG0iAyZuK"
	},
	undead: {
		localization: "BF.CreatureType.Type.Undead",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.OuEGHqtpQB57PxW7"
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
		localization: "BF.CreatureType.Tag.Animal",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.wIVbWmvn1dq8vc68"
	},
	golem: {
		localization: "BF.CreatureType.Tag.Golem",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.g8KIFr6a9FXbDVeX"
	},
	outsider: {
		localization: "BF.CreatureType.Tag.Outsider",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ynBgOpaDVZ1Ofxx4",
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
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.lt1UiK4eCG5W4Htw",
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
 * Encumbrance configuration data.
 *
 * @typedef {object} EncumbranceConfiguration
 * @property {Record<string, object>} effects - Data used to create encumbrance-related Active Effects.
 * @property {Record<string, Record<string, number>} threshold - Amount to multiply strength to get given capacity
 *                                                               threshold.
 * @property {Record<string, Record<string, number>} speedReduction - Speed reduction caused by encumbered status.
 * @property {Record<string, Record<string, string>>} baseUnits - Base units used to calculate carrying weight.
 */

/**
 * Configuration for various aspects of encumbrance calculation.
 * @type {EncumbranceConfiguration}
 */
export const encumbrance = {
	effects: {
		encumbered: {
			name: "EFFECT.BF.Encumbered",
			icon: "systems/black-flag/artwork/statuses/encumbered.svg"
		},
		heavilyEncumbered: {
			name: "EFFECT.BF.HeavilyEncumbered",
			icon: "systems/black-flag/artwork/statuses/heavily-encumbered.svg"
		},
		exceedingCarryingCapacity: {
			name: "EFFECT.BF.ExceedingCarryingCapacity",
			icon: "systems/black-flag/artwork/statuses/exceeding-carrying-capacity.svg"
		}
	},
	threshold: {
		encumbered: {
			imperial: 5
		},
		heavilyEncumbered: {
			imperial: 10
		},
		maximum: {
			imperial: 15
		}
	},
	speedReduction: {
		encumbered: {
			imperial: 10
		},
		heavilyEncumbered: {
			imperial: 20
		},
		exceedingCarryingCapacity: {
			imperial: 5
		}
	},
	baseUnits: {
		default: {
			imperial: "pound"
		}
	}
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
		label: "BF.MOVEMENT.Type.Walk"
	},
	climb: {
		label: "BF.MOVEMENT.Type.Climb",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.CdBLKsrlKHR5HvDr"
	},
	fly: {
		label: "BF.MOVEMENT.Type.Fly",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.CHNmwHjrIZtXEsf4"
	},
	swim: {
		label: "BF.MOVEMENT.Type.Swim",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.nzj83NdxpPZQoW6Z"
	},
	burrow: {
		label: "BF.MOVEMENT.Type.Burrow",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.jzO6qMcEroDupZDD"
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
		label: "BF.MOVEMENT.Tag.Hover.Label",
		display: "BF.MOVEMENT.Tag.Hover.Display",
		type: "associated",
		association: "fly"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                        Resting                        */
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
 * @property {boolean} [recoverHitDice=false] - Should hit dice be recovered?
 * @property {boolean} [recoverHitPoints=false] - Should hit points be recovered?
 * @property {string[]} [recoverPeriods] - Recovery periods as defined in `CONFIG.BlackFlag.recoveryPeriods` that
 *                                         should be applied when this rest is taken. The ordering of the periods
 *                                         determines which is applied if more that one recovery profile is found.
 * @property {Set<string>} [recoverSpellSlotTypes] - Types of spellcasting slots that are recovered on this rest.
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
			recoverPeriods: ["shortRest"],
			recoverSpellSlotTypes: new Set(["pact"])
		},
		long: {
			label: "BF.Rest.Type.Long.Label",
			hint: "BF.Rest.Type.Long.Hint",
			resultMessages: "BF.Rest.Result.Long",
			dialogClass: LongRestDialog,
			recoverHitPoints: true,
			recoverHitDice: true,
			recoverPeriods: ["longRest", "shortRest"],
			recoverSpellSlotTypes: new Set(["leveled", "pact"])
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
		label: "BF.SENSES.Type.Darkvision",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.wdYu7KK3IEKJ8lte"
	},
	keensense: {
		label: "BF.SENSES.Type.Keensense",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.gueujRnHAjOZxT6g"
	},
	tremorsense: {
		label: "BF.SENSES.Type.Tremorsense",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.iGH9wAnloILFHmX8"
	},
	truesight: {
		label: "BF.SENSES.Type.Truesight",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.rGryrzkJD8x0LNkT"
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
		label: "BF.SENSES.Tag.CantSense.Label",
		display: "BF.SENSES.Tag.CantSense.Display",
		type: "associated",
		association: "keensense"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                         Sizes                         */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for creature sizes.
 *
 * @typedef {LabeledConfiguration} SizeConfiguration
 * @property {number|{width: number, height: number}} scale - Default token scale for a creature of this size.
 * @property {number} [capacityMultiplier] - Multiplier used to calculate carrying capacities.
 */

/**
 * Creature sizes defined by the system.
 * @enum {SizeConfiguration}
 */
export const sizes = {
	tiny: {
		label: "BF.Size.Tiny",
		scale: 0.5,
		capacityMultiplier: 0.5
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
		scale: 2,
		capacityMultiplier: 2
	},
	huge: {
		label: "BF.Size.Huge",
		scale: 3,
		capacityMultiplier: 4
	},
	gargantuan: {
		label: "BF.Size.Gargantuan",
		scale: 4,
		capacityMultiplier: 8
	}
};
localizeConfig(sizes, { sort: false });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                          XP                           */
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
