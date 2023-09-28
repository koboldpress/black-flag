/**
 * Types of weapons offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const weapons = {
	simple: {
		localization: "BF.Weapon.Category.Simple",
		children: {
			// Simple Melee
			club: {
				label: "BF.Weapon.Type.Club"
			},
			dagger: {
				label: "BF.Weapon.Type.Dagger"
			},
			greatclub: {
				label: "BF.Weapon.Type.Greatclub"
			},
			handaxe: {
				label: "BF.Weapon.Type.Handaxe"
			},
			javelin: {
				label: "BF.Weapon.Type.Javelin"
			},
			lightHammer: {
				label: "BF.Weapon.Type.LightHammer"
			},
			mace: {
				label: "BF.Weapon.Type.Mace"
			},
			quarterstaff: {
				label: "BF.Weapon.Type.Quarterstaff"
			},
			spear: {
				label: "BF.Weapon.Type.Spear"
			},
			// Simple Ranged
			lightCrossbow: {
				label: "BF.Weapon.Type.CrossbowLight"
			},
			dart: {
				label: "BF.Weapon.Type.Dart"
			},
			shortbow: {
				label: "BF.Weapon.Type.Shortbow"
			},
			sling: {
				label: "BF.Weapon.Type.Sling"
			}
		}
	},
	martial: {
		localization: "BF.Weapon.Category.Martial",
		children: {
			// Martial Melee
			battleaxe: {
				label: "BF.Weapon.Type.Battleaxe"
			},
			flail: {
				label: "BF.Weapon.Type.Flail"
			},
			greataxe: {
				label: "BF.Weapon.Type.Greataxe"
			},
			greatsword: {
				label: "BF.Weapon.Type.Greatsword"
			},
			halberd: {
				label: "BF.Weapon.Type.Halberd"
			},
			longsword: {
				label: "BF.Weapon.Type.Longsword"
			},
			maul: {
				label: "BF.Weapon.Type.Maul"
			},
			morningstar: {
				label: "BF.Weapon.Type.Morningstar"
			},
			rapier: {
				label: "BF.Weapon.Type.Rapier"
			},
			scimitar: {
				label: "BF.Weapon.Type.Scimitar"
			},
			shortsword: {
				label: "BF.Weapon.Type.Shortsword"
			},
			warhammer: {
				label: "BF.Weapon.Type.Warhammer"
			},
			// Martial Ranged
			handCrossbow: {
				label: "BF.Weapon.Type.CrossbowHand"
			},
			heavyCrossbow: {
				label: "BF.Weapon.Type.CrossbowHeavy"
			},
			longbow: {
				label: "BF.Weapon.Type.Longbow"
			}
		}
	}
};
