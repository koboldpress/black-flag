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
		label: "BF.WEAPON.Category.Simple",
		localization: "BF.WEAPON.Category.Simple",
		children: {
			// Simple Melee
			club: {
				label: "BF.WEAPON.Base.Club",
				type: "melee",
				link: "Compendium.black-flag.items.Item.WhFDR7nOBaBhhwmp"
			},
			dagger: {
				label: "BF.WEAPON.Base.Dagger",
				type: "melee",
				link: "Compendium.black-flag.items.Item.3bEIZYDB4eMayC6k"
			},
			greatclub: {
				label: "BF.WEAPON.Base.Greatclub",
				type: "melee",
				link: "Compendium.black-flag.items.Item.QAPscsGRbv5l778n"
			},
			handaxe: {
				label: "BF.WEAPON.Base.Handaxe",
				type: "melee",
				link: "Compendium.black-flag.items.Item.y6xWtgpXkPkn8cqO"
			},
			javelin: {
				label: "BF.WEAPON.Base.Javelin",
				type: "melee",
				link: "Compendium.black-flag.items.Item.8wAd9MmtaW1tizSN"
			},
			lightHammer: {
				label: "BF.WEAPON.Base.LightHammer",
				type: "melee",
				link: "Compendium.black-flag.items.Item.JBfKqjO5hbNcX6zN"
			},
			mace: {
				label: "BF.WEAPON.Base.Mace",
				type: "melee",
				link: "Compendium.black-flag.items.Item.XOrCLbriQXUoLCTL"
			},
			quarterstaff: {
				label: "BF.WEAPON.Base.Quarterstaff",
				type: "melee",
				link: "Compendium.black-flag.items.Item.B5J4heAlwqhvzXKW"
			},
			sickle: {
				label: "BF.WEAPON.Base.Sickle",
				type: "melee",
				link: "Compendium.black-flag.items.Item.MLfeXpp9ZSPKrB7w"
			},
			spear: {
				label: "BF.WEAPON.Base.Spear",
				type: "melee",
				link: "Compendium.black-flag.items.Item.eG0Vk1Kr8peAAYhW"
			},
			// Simple Ranged
			lightCrossbow: {
				label: "BF.WEAPON.Base.CrossbowLight",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.Zu15sMMg2KvxhA3e"
			},
			dart: {
				label: "BF.WEAPON.Base.Dart",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.14pCY7bJYfjnSZqB"
			},
			pistol: {
				label: "BF.WEAPON.Base.Pistol",
				type: "ranged",
				rules: "firearms"
			},
			shortbow: {
				label: "BF.WEAPON.Base.Shortbow",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.Zu15sMMg2KvxhA3e"
			},
			sling: {
				label: "BF.WEAPON.Base.Sling",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.QoMwONkjb7knNonO"
			}
		}
	},
	martial: {
		label: "BF.WEAPON.Category.Martial",
		localization: "BF.WEAPON.Category.Martial",
		children: {
			// Martial Melee
			battleaxe: {
				label: "BF.WEAPON.Base.Battleaxe",
				type: "melee",
				link: "Compendium.black-flag.items.Item.bDVnEZSy0tcZg0js"
			},
			flail: {
				label: "BF.WEAPON.Base.Flail",
				type: "melee",
				link: "Compendium.black-flag.items.Item.eEVYQ21cIi97CRl1"
			},
			glaive: {
				label: "BF.WEAPON.Base.Glaive",
				type: "melee",
				link: "Compendium.black-flag.items.Item.caf9G1uCz7agcoym"
			},
			greataxe: {
				label: "BF.WEAPON.Base.Greataxe",
				type: "melee",
				link: "Compendium.black-flag.items.Item.9EAkaGqWPK0qFoDq"
			},
			greatsword: {
				label: "BF.WEAPON.Base.Greatsword",
				type: "melee",
				link: "Compendium.black-flag.items.Item.LG9czlXCwzBSmWR4"
			},
			halberd: {
				label: "BF.WEAPON.Base.Halberd",
				type: "melee",
				link: "Compendium.black-flag.items.Item.PV6JskvwVJ9BVvQb"
			},
			lance: {
				label: "BF.WEAPON.Base.Lance",
				type: "melee",
				link: "Compendium.black-flag.items.Item.vDPNvqRkuKnzAbvR"
			},
			longsword: {
				label: "BF.WEAPON.Base.Longsword",
				type: "melee",
				link: "Compendium.black-flag.items.Item.ym1owWiMSNOcZNdO"
			},
			maul: {
				label: "BF.WEAPON.Base.Maul",
				type: "melee",
				link: "Compendium.black-flag.items.Item.WWJHSzi0T466vB3o"
			},
			morningstar: {
				label: "BF.WEAPON.Base.Morningstar",
				type: "melee",
				link: "Compendium.black-flag.items.Item.zWBmus194O0RLxeU"
			},
			pike: {
				label: "BF.WEAPON.Base.Pike",
				type: "melee",
				link: "Compendium.black-flag.items.Item.ib6aTaDTjlnG3m54"
			},
			rapier: {
				label: "BF.WEAPON.Base.Rapier",
				type: "melee",
				link: "Compendium.black-flag.items.Item.pcyyBxMi5naeXbSt"
			},
			scimitar: {
				label: "BF.WEAPON.Base.Scimitar",
				type: "melee",
				link: "Compendium.black-flag.items.Item.MwYjehTr9oJlHb1Z"
			},
			scythe: {
				label: "BF.WEAPON.Base.Scythe",
				type: "melee",
				link: "Compendium.black-flag.items.Item.4diYN02TlcURqvK3"
			},
			shortsword: {
				label: "BF.WEAPON.Base.Shortsword",
				type: "melee",
				link: "Compendium.black-flag.items.Item.C9nwbmL7uTX8t8nr"
			},
			trident: {
				label: "BF.WEAPON.Base.Trident",
				type: "melee",
				link: "Compendium.black-flag.items.Item.KOE2ZOUMtbY0OkS9"
			},
			warPick: {
				label: "BF.WEAPON.Base.WarPick",
				type: "melee",
				link: "Compendium.black-flag.items.Item.EcuWrcnF6FY79arQ"
			},
			warhammer: {
				label: "BF.WEAPON.Base.Warhammer",
				type: "melee",
				link: "Compendium.black-flag.items.Item.E7IJC52xWk7Utk4p"
			},
			whip: {
				label: "BF.WEAPON.Base.Whip",
				type: "melee",
				link: "Compendium.black-flag.items.Item.teX6pEUhupO8LBTu"
			},
			// Martial Ranged
			arquebus: {
				label: "BF.WEAPON.Base.Arquebus",
				type: "ranged",
				rules: "firearms"
			},
			blowgun: {
				label: "BF.WEAPON.Base.Blowgun",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.5jfXHBmPqbspahJk"
			},
			blunderbuss: {
				label: "BF.WEAPON.Base.Blunderbuss",
				type: "ranged",
				rules: "firearms"
			},
			handCrossbow: {
				label: "BF.WEAPON.Base.CrossbowHand",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.b126bs62p8TQIYZ8"
			},
			heavyCrossbow: {
				label: "BF.WEAPON.Base.CrossbowHeavy",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.Z8Wz5qUi16C36QQd"
			},
			longbow: {
				label: "BF.WEAPON.Base.Longbow",
				type: "ranged",
				link: "Compendium.black-flag.items.Item.IpWwpPrnKuwHQpVw"
			},
			musket: {
				label: "BF.WEAPON.Base.Musket",
				type: "ranged",
				rules: "firearms"
			},
			revolvingMusket: {
				label: "BF.WEAPON.Base.RevolvingMusket",
				type: "ranged",
				rules: "firearms"
			}
		}
	}
};
localizeConfig(weapons, { flatten: true });
localizeConfig(weapons, { sort: false, propertyName: "localizedCategories" });
localizeConfig(weapons.simple.children);
localizeConfig(weapons.martial.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * @typedef {LabeledConfiguration} WeaponOptionConfiguration
 * @property {string} [rules] - Rules setting category that allows these options to be toggled by GM.
 */

/**
 * Alternate actions that can be taken with weapons.
 * @enum {LabeledConfiguration}
 */
export const weaponOptions = {
	bash: {
		label: "BF.WEAPON.Option.Bash"
	},
	disarm: {
		label: "BF.WEAPON.Option.Disarm"
	},
	hamstring: {
		label: "BF.WEAPON.Option.Hamstring"
	},
	harmlessFusillade: {
		label: "BF.WEAPON.Option.HarmlessFusillade",
		rules: "firearms"
	},
	pinningShot: {
		label: "BF.WEAPON.Option.PinningShot"
	},
	pull: {
		label: "BF.WEAPON.Option.Pull"
	},
	ricochetShot: {
		label: "BF.WEAPON.Option.RicochetShot"
	},
	trip: {
		label: "BF.WEAPON.Option.Trip"
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
	"gunpowder",
	"heavy",
	"light",
	"loading",
	"magazine",
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
		label: "BF.WEAPON.Type.Melee"
	},
	ranged: {
		label: "BF.WEAPON.Type.Ranged"
	}
};
localizeConfig(weaponTypes, { sort: false });
