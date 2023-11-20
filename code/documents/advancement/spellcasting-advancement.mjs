import { SpellcastingConfigurationData } from "../../data/advancement/spellcasting-data.mjs";
import Advancement from "./advancement.mjs";

export default class SpellcastingAdvancement extends Advancement {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "spellcasting",
		dataModels: {
			configuration: SpellcastingConfigurationData
		},
		order: 35,
		icon: "systems/black-flag/artwork/advancement/spellcasting.svg",
		title: "BF.Advancement.Spellcasting.Title",
		hint: "BF.Advancement.Spellcasting.Hint"
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	summaryForLevel(levels, { flow=false }={}) {
		return flow ? "" : this.configuration.label;
	}
}
