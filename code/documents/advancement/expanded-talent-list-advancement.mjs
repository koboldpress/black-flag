import ImprovementConfig from "../../applications/advancement/improvement-config.mjs";
import { ImprovementConfigurationData } from "../../data/advancement/improvement-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that allows player to access a second talent list when taking an improvement.
 * **Can only be added to subclasses and each subclass can only have one.**
 */
export default class ExpandedTalentListAdvancement extends Advancement {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		name: "expandedTalentList",
		dataModels: {
			configuration: ImprovementConfigurationData
		},
		order: 45,
		icon: "systems/black-flag/artwork/advancement/improvement.svg",
		title: "BF.Advancement.ExpandedTalentList.Title",
		hint: "BF.Advancement.ExpandedTalentList.Hint",
		apps: {
			config: ImprovementConfig
		}
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	get levels() {
		return [3];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	summaryForLevel(levels, { flow=false }={}) {
		return `<span class="choice-entry"><span class="choice-name">${
			CONFIG.BlackFlag.talentCategories.localizedPlural[this.configuration.talentList]}</span></span>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static availableForItem(item) {
		return !item.system.advancement.byType(this.metadata.name).length;
	}
}
