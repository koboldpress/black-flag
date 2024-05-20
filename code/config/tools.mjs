import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of tools offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const tools = {
	alchemist: {
		label: "BF.Tool.Type.AlchemistsTools"
	},
	artist: {
		label: "BF.Tool.Type.ArtistTools"
	},
	charlatan: {
		label: "BF.Tool.Type.CharlatanTools"
	},
	clothier: {
		label: "BF.Tool.Type.ClothierTools"
	},
	construction: {
		label: "BF.Tool.Type.ConstructionTools"
	},
	gaming: {
		localization: "BF.Tool.Category.GamingSet",
		children: {
			dice: {
				label: "BF.Tool.Type.DiceSet"
			},
			card: {
				label: "BF.Tool.Type.CardSet"
			}
		}
	},
	smithing: {
		label: "BF.Tool.Type.SmithingTools"
	},
	herbalist: {
		label: "BF.Tool.Type.HerbalistTools"
	},
	musicalInstrument: {
		localization: "BF.Tool.Category.MusicalInstrument",
		children: {
			bagpipes: {
				label: "BF.Tool.Type.Bagpipes"
			},
			drum: {
				label: "BF.Tool.Type.Drum"
			},
			flute: {
				label: "BF.Tool.Type.Flute"
			},
			lute: {
				label: "BF.Tool.Type.Lute"
			},
			lyre: {
				label: "BF.Tool.Type.Lyre"
			},
			horn: {
				label: "BF.Tool.Type.Horn"
			}
		}
	},
	navigator: {
		label: "BF.Tool.Type.NavigatorTools"
	},
	provisioner: {
		label: "BF.Tool.Type.ProvisionerTools"
	},
	trapper: {
		label: "BF.Tool.Type.TrapperTools"
	},
	thieves: {
		label: "BF.Tool.Type.ThievesTools"
	},
	tinker: {
		label: "BF.Tool.Type.TinkerTools"
	}
};
localizeConfig(tools, { pluralRule: "other" });
localizeConfig(tools.gaming.children);
localizeConfig(tools.musicalInstrument.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to tools.
 * @type {string[]}
 */
export const toolProperties = ["magical"];
