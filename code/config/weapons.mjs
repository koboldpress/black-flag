import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of weapons offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const weapons = {
	simple: {
		label: "BF.Weapon.Category.Simple",
		localization: "BF.Weapon.Category.Simple",
		children: {
			// Simple Melee
			club: {
				label: "BF.Weapon.Base.Club",
				type: "melee"
			},
			dagger: {
				label: "BF.Weapon.Base.Dagger",
				type: "melee"
			},
			greatclub: {
				label: "BF.Weapon.Base.Greatclub",
				type: "melee"
			},
			handaxe: {
				label: "BF.Weapon.Base.Handaxe",
				type: "melee"
			},
			javelin: {
				label: "BF.Weapon.Base.Javelin",
				type: "melee"
			},
			lightHammer: {
				label: "BF.Weapon.Base.LightHammer",
				type: "melee"
			},
			mace: {
				label: "BF.Weapon.Base.Mace",
				type: "melee"
			},
			quarterstaff: {
				label: "BF.Weapon.Base.Quarterstaff",
				type: "melee"
			},
			spear: {
				label: "BF.Weapon.Base.Spear",
				type: "melee"
			},
			// Simple Ranged
			lightCrossbow: {
				label: "BF.Weapon.Base.CrossbowLight",
				type: "ranged"
			},
			dart: {
				label: "BF.Weapon.Base.Dart",
				type: "ranged"
			},
			shortbow: {
				label: "BF.Weapon.Base.Shortbow",
				type: "ranged"
			},
			sling: {
				label: "BF.Weapon.Base.Sling",
				type: "ranged"
			}
		}
	},
	martial: {
		label: "BF.Weapon.Category.Martial",
		localization: "BF.Weapon.Category.Martial",
		children: {
			// Martial Melee
			battleaxe: {
				label: "BF.Weapon.Base.Battleaxe",
				type: "melee"
			},
			flail: {
				label: "BF.Weapon.Base.Flail",
				type: "melee"
			},
			greataxe: {
				label: "BF.Weapon.Base.Greataxe",
				type: "melee"
			},
			greatsword: {
				label: "BF.Weapon.Base.Greatsword",
				type: "melee"
			},
			halberd: {
				label: "BF.Weapon.Base.Halberd",
				type: "melee"
			},
			longsword: {
				label: "BF.Weapon.Base.Longsword",
				type: "melee"
			},
			maul: {
				label: "BF.Weapon.Base.Maul",
				type: "melee"
			},
			morningstar: {
				label: "BF.Weapon.Base.Morningstar",
				type: "melee"
			},
			rapier: {
				label: "BF.Weapon.Base.Rapier",
				type: "melee"
			},
			scimitar: {
				label: "BF.Weapon.Base.Scimitar",
				type: "melee"
			},
			shortsword: {
				label: "BF.Weapon.Base.Shortsword",
				type: "melee"
			},
			warhammer: {
				label: "BF.Weapon.Base.Warhammer",
				type: "melee"
			},
			// Martial Ranged
			handCrossbow: {
				label: "BF.Weapon.Base.CrossbowHand",
				type: "ranged"
			},
			heavyCrossbow: {
				label: "BF.Weapon.Base.CrossbowHeavy",
				type: "ranged"
			},
			longbow: {
				label: "BF.Weapon.Base.Longbow",
				type: "ranged"
			}
		}
	}
};
localizeConfig(weapons, { sort: false });
localizeConfig(weapons.simple.children);
localizeConfig(weapons.martial.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Alternate actions that can be taken with weapons.
 * @enum {LabeledConfiguration}
 */
export const weaponOptions = {
	bash: {
		label: "BF.Weapon.Option.Bash"
	},
	disarm: {
		label: "BF.Weapon.Option.Disarm"
	},
	hamstring: {
		label: "BF.Weapon.Option.Hamstring"
	},
	pinningShot: {
		label: "BF.Weapon.Option.PinningShot"
	},
	pull: {
		label: "BF.Weapon.Option.Pull"
	},
	ricochetShot: {
		label: "BF.Weapon.Option.RicochetShot"
	},
	trip: {
		label: "BF.Weapon.Option.Trip"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to weapons.
 * @type {string[]}
 */
export const weaponProperties = [
	"ammunition",
	"finesse",
	"heavy",
	"light",
	"loading",
	"magical",
	"reach",
	"thrown",
	"twoHanded",
	"versatile"
];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Types of weapons supported.
 * @enum {LabeledConfiguration}
 */
export const weaponTypes = {
	melee: {
		label: "BF.Weapon.Type.Melee"
	},
	ranged: {
		label: "BF.Weapon.Type.Ranged"
	}
};
localizeConfig(weaponTypes, { sort: false });
