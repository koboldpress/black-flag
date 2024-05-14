import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of tools offered by the system.
 * @enum {NestedTypeConfiguration}
 */
export const tools = {
	artisan: {
		localization: "BF.Tool.Category.Artisan",
		children: {
			alchemist: {
				label: "BF.Tool.Type.AlchemistsSupplies"
			},
			brewer: {
				label: "BF.Tool.Type.BrewersSupplies"
			},
			calligrapher: {
				label: "BF.Tool.Type.CalligraphersSupplies"
			},
			carpenter: {
				label: "BF.Tool.Type.CarpentersTools"
			},
			cook: {
				label: "BF.Tool.Type.CooksUtensils"
			},
			leatherworker: {
				label: "BF.Tool.Type.LeatherworkersTools"
			},
			mason: {
				label: "BF.Tool.Type.MasonsTools"
			},
			painter: {
				label: "BF.Tool.Type.PaintersSupplies"
			},
			potter: {
				label: "BF.Tool.Type.PottersTools"
			},
			smith: {
				label: "BF.Tool.Type.SmithsTools"
			},
			tinker: {
				label: "BF.Tool.Type.TinkersTools"
			},
			weaver: {
				label: "BF.Tool.Type.WeaversTools"
			},
			woodcarver: {
				label: "BF.Tool.Type.WoodcarversTools"
			}
		}
	},
	disguiseKit: {
		label: "BF.Tool.Type.DisguiseKit"
	},
	gaming: {
		localization: "BF.Tool.Category.GamingSet",
		children: {
			dice: {
				label: "BF.Tool.Type.DiceSet"
			},
			playingCard: {
				label: "BF.Tool.Type.PlayingCardSet"
			}
		}
	},
	herbalism: {
		label: "BF.Tool.Type.HerbalismKit"
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
	poisonersKit: {
		label: "BF.Tool.Type.PoisonersKit"
	},
	thievesTools: {
		label: "BF.Tool.Type.ThievesTools"
	},
	vehicle: {
		localization: "BF.Tool.Category.Vehicle",
		children: {
			land: {
				localization: "BF.Vehicle.Type.Land"
			},
			water: {
				localization: "BF.Vehicle.Type.Water"
			}
		}
	}
};
localizeConfig(tools, { pluralRule: "other" });
localizeConfig(tools.artisan.children);
localizeConfig(tools.gaming.children);
localizeConfig(tools.musicalInstrument.children);
localizeConfig(tools.vehicle.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to tools.
 * @type {string[]}
 */
export const toolProperties = ["magical"];
