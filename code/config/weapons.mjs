import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of weapons offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const weapons = {
	simple: {
		label: "BF.Weapon.Category.Simple.Label",
		localization: "BF.Weapon.Category.Simple",
		children: {
			// Simple Melee
			club: {
				label: "BF.Weapon.Base.Club"
			},
			dagger: {
				label: "BF.Weapon.Base.Dagger"
			},
			greatclub: {
				label: "BF.Weapon.Base.Greatclub"
			},
			handaxe: {
				label: "BF.Weapon.Base.Handaxe"
			},
			javelin: {
				label: "BF.Weapon.Base.Javelin"
			},
			lightHammer: {
				label: "BF.Weapon.Base.LightHammer"
			},
			mace: {
				label: "BF.Weapon.Base.Mace"
			},
			quarterstaff: {
				label: "BF.Weapon.Base.Quarterstaff"
			},
			spear: {
				label: "BF.Weapon.Base.Spear"
			},
			// Simple Ranged
			lightCrossbow: {
				label: "BF.Weapon.Base.CrossbowLight"
			},
			dart: {
				label: "BF.Weapon.Base.Dart"
			},
			shortbow: {
				label: "BF.Weapon.Base.Shortbow"
			},
			sling: {
				label: "BF.Weapon.Base.Sling"
			}
		}
	},
	martial: {
		label: "BF.Weapon.Category.Martial.Label",
		localization: "BF.Weapon.Category.Martial",
		children: {
			// Martial Melee
			battleaxe: {
				label: "BF.Weapon.Base.Battleaxe"
			},
			flail: {
				label: "BF.Weapon.Base.Flail"
			},
			greataxe: {
				label: "BF.Weapon.Base.Greataxe"
			},
			greatsword: {
				label: "BF.Weapon.Base.Greatsword"
			},
			halberd: {
				label: "BF.Weapon.Base.Halberd"
			},
			longsword: {
				label: "BF.Weapon.Base.Longsword"
			},
			maul: {
				label: "BF.Weapon.Base.Maul"
			},
			morningstar: {
				label: "BF.Weapon.Base.Morningstar"
			},
			rapier: {
				label: "BF.Weapon.Base.Rapier"
			},
			scimitar: {
				label: "BF.Weapon.Base.Scimitar"
			},
			shortsword: {
				label: "BF.Weapon.Base.Shortsword"
			},
			warhammer: {
				label: "BF.Weapon.Base.Warhammer"
			},
			// Martial Ranged
			handCrossbow: {
				label: "BF.Weapon.Base.CrossbowHand"
			},
			heavyCrossbow: {
				label: "BF.Weapon.Base.CrossbowHeavy"
			},
			longbow: {
				label: "BF.Weapon.Base.Longbow"
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
		label: "BF.Weapon.Option.Bash.Label"
	},
	disarm: {
		label: "BF.Weapon.Option.Disarm.Label"
	},
	hamstring: {
		label: "BF.Weapon.Option.Hamstring.Label"
	},
	pinningShot: {
		label: "BF.Weapon.Option.PinningShot.Label"
	},
	pull: {
		label: "BF.Weapon.Option.Pull.Label"
	},
	ricochetShot: {
		label: "BF.Weapon.Option.RicochetShot.Label"
	},
	trip: {
		label: "BF.Weapon.Option.Trip.Label"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to weapons.
 * @enum {LabeledConfiguration}
 */
export const weaponProperties = {
	ammunition: {
		label: "BF.Weapon.Property.Ammunition.Label"
	},
	finesse: {
		label: "BF.Weapon.Property.Finesse.Label"
	},
	heavy: {
		label: "BF.Weapon.Property.Heavy.Label"
	},
	light: {
		label: "BF.Weapon.Property.Light.Label"
	},
	loading: {
		label: "BF.Weapon.Property.Loading.Label"
	},
	reach: {
		label: "BF.Weapon.Property.Reach.Label"
	},
	thrown: {
		label: "BF.Weapon.Property.Thrown.Label"
	},
	twoHanded: {
		label: "BF.Weapon.Property.TwoHanded.Label"
	},
	versatile: {
		label: "BF.Weapon.Property.Versatile.Label"
	}
};

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
