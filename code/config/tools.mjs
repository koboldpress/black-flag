import { localizeConfig } from "../utils/_module.mjs";

/**
 * Types of tools offered by the system.
 * @enum {NestedLinkedConfiguration}
 */
export const tools = {
	alchemist: {
		label: "BF.Tool.Type.AlchemistsTools",
		link: "Compendium.black-flag.items.Item.klz44oS9m4omG4eG"
	},
	artist: {
		label: "BF.Tool.Type.ArtistTools",
		link: "Compendium.black-flag.items.Item.lTlzI4osF7eGrLeY"
	},
	charlatan: {
		label: "BF.Tool.Type.CharlatanTools",
		link: "Compendium.black-flag.items.Item.1isXFPSnVUYm2qaQ"
	},
	clothier: {
		label: "BF.Tool.Type.ClothierTools",
		link: "Compendium.black-flag.items.Item.42AxnVcNl4R5WZj6"
	},
	construction: {
		label: "BF.Tool.Type.ConstructionTools",
		link: "Compendium.black-flag.items.Item.SDHvjOXW8MCnj54h"
	},
	gaming: {
		localization: "BF.Tool.Category.GamingSet",
		children: {
			dice: {
				label: "BF.Tool.Type.DiceSet",
				link: "Compendium.black-flag.items.Item.BI9JyierXbSWY3ra"
			},
			card: {
				label: "BF.Tool.Type.CardSet",
				link: "Compendium.black-flag.items.Item.Q7MSeHGCKue2HJha"
			}
		}
	},
	smithing: {
		label: "BF.Tool.Type.SmithingTools",
		link: "Compendium.black-flag.items.Item.fKjUrqM49opM4ps5"
	},
	herbalist: {
		label: "BF.Tool.Type.HerbalistTools",
		link: "Compendium.black-flag.items.Item.mhgW4NnKHq3Vy1nL"
	},
	musicalInstrument: {
		localization: "BF.Tool.Category.MusicalInstrument",
		children: {
			bagpipes: {
				label: "BF.Tool.Type.Bagpipes",
				link: "Compendium.black-flag.items.Item.vWJIN3enB9IwOmLa"
			},
			drum: {
				label: "BF.Tool.Type.Drum",
				link: "Compendium.black-flag.items.Item.HlPUKSzchiQQ8nXl"
			},
			flute: {
				label: "BF.Tool.Type.Flute",
				link: "Compendium.black-flag.items.Item.r4pkxm6VaV5jK3tQ"
			},
			lute: {
				label: "BF.Tool.Type.Lute",
				link: "Compendium.black-flag.items.Item.wmeF325yhWOASJki"
			},
			lyre: {
				label: "BF.Tool.Type.Lyre",
				link: "Compendium.black-flag.items.Item.mUhO214yHXAMN3W0"
			},
			horn: {
				label: "BF.Tool.Type.Horn",
				link: "Compendium.black-flag.items.Item.5gz3GKKchBFXOjj4"
			}
		}
	},
	navigator: {
		label: "BF.Tool.Type.NavigatorTools",
		link: "Compendium.black-flag.items.Item.2TuWsCp00Sbgaer3"
	},
	provisioner: {
		label: "BF.Tool.Type.ProvisionerTools",
		link: "Compendium.black-flag.items.Item.poBCR3CoQsHVKxU9"
	},
	trapper: {
		label: "BF.Tool.Type.TrapperTools",
		link: "Compendium.black-flag.items.Item.AwkFxBWOGLP5de8W"
	},
	thieves: {
		label: "BF.Tool.Type.ThievesTools",
		link: "Compendium.black-flag.items.Item.cNWGEyGSVCYKxmCg"
	},
	tinker: {
		label: "BF.Tool.Type.TinkerTools",
		link: "Compendium.black-flag.items.Item.02Se8KL2vaL2BF5s"
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
