/**
 * Types of armor offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const armor = {
	light: {
		localization: "BF.Armor.Category.Light",
		children: {
			leather: {
				label: "BF.Armor.Type.Leather"
			},
			studdedLeather: {
				label: "BF.Armor.Type.StuddedLeather"
			}
		}
	},
	medium: {
		localization: "BF.Armor.Category.Medium",
		children: {
			hide: {
				label: "BF.Armor.Type.Hide"
			},
			chainShirt: {
				label: "BF.Armor.Type.ChainShirt"
			},
			scaleMail: {
				label: "BF.Armor.Type.ScaleMail"
			},
			halfPlate: {
				label: "BF.Armor.Type.HalfPlate"
			}
		}
	},
	heavy: {
		localization: "BF.Armor.Category.Heavy",
		children: {
			ringMail: {
				label: "BF.Armor.Type.RingMail"
			},
			chainMail: {
				label: "BF.Armor.Type.ChainMail"
			},
			splint: {
				label: "BF.Armor.Type.Splint"
			},
			plate: {
				label: "BF.Armor.Type.Plate"
			}
		}
	},
	shield: {
		localization: "BF.Armor.Category.Shield"
	}
};
