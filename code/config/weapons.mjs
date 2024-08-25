import { localizeConfig } from "../utils/_module.mjs";

/**
 * Modes that can be used when attacking.
 * @typedef {LabeledConfiguration}
 */
export const attackModes = {
	oneHanded: {
		label: "BF.ATTACK.Mode.OneHanded"
	},
	twoHanded: {
		label: "BF.ATTACK.Mode.TwoHanded"
	},
	offhand: {
		label: "BF.ATTACK.Mode.Offhand"
	},
	thrown: {
		label: "BF.ATTACK.Mode.Thrown"
	},
	thrownOffhand: {
		label: "BF.ATTACK.Mode.ThrownOffhand"
	}
};
localizeConfig(attackModes, { sort: false });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Types of weapons offered by the system.
 * @enum {NestedLinkedConfiguration}
 */
export const weapons = {
	simple: {
		label: "BF.Weapon.Category.Simple",
		localization: "BF.Weapon.Category.Simple",
		children: {
			// Simple Melee
			club: {
				label: "BF.Weapon.Base.Club",
				type: "melee",
				link: "Compendium.black-flag.items.Item.WhFDR7nOBaBhhwmp"
			},
			dagger: {
				label: "BF.Weapon.Base.Dagger",
				type: "melee",
				link: "Compendium.black-flag.items.Item.3bEIZYDB4eMayC6k"
			},
			greatclub: {
				label: "BF.Weapon.Base.Greatclub",
				type: "melee",
				link: "Compendium.black-flag.items.Item.QAPscsGRbv5l778n"
			},
			handaxe: {
				label: "BF.Weapon.Base.Handaxe",
				type: "melee",
				link: "Compendium.black-flag.items.Item.y6xWtgpXkPkn8cqO"
			},
			javelin: {
				label: "BF.Weapon.Base.Javelin",
				type: "melee",
				link: "Compendium.black-flag.items.Item.8wAd9MmtaW1tizSN"
			},
			lightHammer: {
				label: "BF.Weapon.Base.LightHammer",
				type: "melee",
				link: "Compendium.black-flag.items.Item.JBfKqjO5hbNcX6zN"
			},
			mace: {
				label: "BF.Weapon.Base.Mace",
				type: "melee",
				link: "Compendium.black-flag.items.Item.XOrCLbriQXUoLCTL"
			},
			quarterstaff: {
				label: "BF.Weapon.Base.Quarterstaff",
				type: "melee",
				link: "Compendium.black-flag.items.Item.B5J4heAlwqhvzXKW"
			},
			sickle: {
				label: "BF.Weapon.Base.Sickle",
				type: "melee",
				link: "Compendium.black-flag.items.Item.MLfeXpp9ZSPKrB7w"
			},
			spear: {
				label: "BF.Weapon.Base.Spear",
				type: "melee",
				link: "Compendium.black-flag.items.Item.eG0Vk1Kr8peAAYhW"
			},
			// Simple Ranged
			lightCrossbow: {
				label: "BF.Weapon.Base.CrossbowLight",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.Zu15sMMg2KvxhA3e"
			},
			dart: {
				label: "BF.Weapon.Base.Dart",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.14pCY7bJYfjnSZqB"
			},
			shortbow: {
				label: "BF.Weapon.Base.Shortbow",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.Zu15sMMg2KvxhA3e"
			},
			sling: {
				label: "BF.Weapon.Base.Sling",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.QoMwONkjb7knNonO"
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
				type: "melee",
				link: "Compendium.black-flag.items.Item.bDVnEZSy0tcZg0js"
			},
			flail: {
				label: "BF.Weapon.Base.Flail",
				type: "melee",
				link: "Compendium.black-flag.items.Item.eEVYQ21cIi97CRl1"
			},
			glaive: {
				label: "BF.Weapon.Base.Glaive",
				type: "melee",
				link: "Compendium.black-flag.items.Item.caf9G1uCz7agcoym"
			},
			greataxe: {
				label: "BF.Weapon.Base.Greataxe",
				type: "melee",
				link: "Compendium.black-flag.items.Item.9EAkaGqWPK0qFoDq"
			},
			greatsword: {
				label: "BF.Weapon.Base.Greatsword",
				type: "melee",
				link: "Compendium.black-flag.items.Item.LG9czlXCwzBSmWR4"
			},
			halberd: {
				label: "BF.Weapon.Base.Halberd",
				type: "melee",
				link: "Compendium.black-flag.items.Item.PV6JskvwVJ9BVvQb"
			},
			lance: {
				label: "BF.Weapon.Base.Lance",
				type: "melee",
				link: "Compendium.black-flag.items.Item.vDPNvqRkuKnzAbvR"
			},
			longsword: {
				label: "BF.Weapon.Base.Longsword",
				type: "melee",
				link: "Compendium.black-flag.items.Item.ym1owWiMSNOcZNdO"
			},
			maul: {
				label: "BF.Weapon.Base.Maul",
				type: "melee",
				link: "Compendium.black-flag.items.Item.WWJHSzi0T466vB3o"
			},
			morningstar: {
				label: "BF.Weapon.Base.Morningstar",
				type: "melee",
				link: "Compendium.black-flag.items.Item.zWBmus194O0RLxeU"
			},
			pike: {
				label: "BF.Weapon.Base.Pike",
				type: "melee",
				link: "Compendium.black-flag.items.Item.ib6aTaDTjlnG3m54"
			},
			rapier: {
				label: "BF.Weapon.Base.Rapier",
				type: "melee",
				link: "Compendium.black-flag.items.Item.pcyyBxMi5naeXbSt"
			},
			scimitar: {
				label: "BF.Weapon.Base.Scimitar",
				type: "melee",
				link: "Compendium.black-flag.items.Item.MwYjehTr9oJlHb1Z"
			},
			scythe: {
				label: "BF.Weapon.Base.Scythe",
				type: "melee",
				link: "Compendium.black-flag.items.Item.4diYN02TlcURqvK3"
			},
			shortsword: {
				label: "BF.Weapon.Base.Shortsword",
				type: "melee",
				link: "Compendium.black-flag.items.Item.C9nwbmL7uTX8t8nr"
			},
			trident: {
				label: "BF.Weapon.Base.Trident",
				type: "melee",
				link: "Compendium.black-flag.items.Item.KOE2ZOUMtbY0OkS9"
			},
			warPick: {
				label: "BF.Weapon.Base.WarPick",
				type: "melee",
				link: "Compendium.black-flag.items.Item.EcuWrcnF6FY79arQ"
			},
			warhammer: {
				label: "BF.Weapon.Base.Warhammer",
				type: "melee",
				link: "Compendium.black-flag.items.Item.E7IJC52xWk7Utk4p"
			},
			whip: {
				label: "BF.Weapon.Base.Whip",
				type: "melee",
				link: "Compendium.black-flag.items.Item.teX6pEUhupO8LBTu"
			},
			// Martial Ranged
			blowgun: {
				label: "BF.Weapon.Base.Blowgun",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.5jfXHBmPqbspahJk"
			},
			handCrossbow: {
				label: "BF.Weapon.Base.CrossbowHand",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.b126bs62p8TQIYZ8"
			},
			heavyCrossbow: {
				label: "BF.Weapon.Base.CrossbowHeavy",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.Z8Wz5qUi16C36QQd"
			},
			longbow: {
				label: "BF.Weapon.Base.Longbow",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.IpWwpPrnKuwHQpVw"
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
	"special",
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
