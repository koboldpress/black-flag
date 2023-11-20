import { ImprovementConfigurationData } from "../../data/advancement/improvement-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that allows player to access a second talent list when taking an improvement.
 * **Can only be added to subclasses and each subclass can only have one.**
 */
export default class ExpandedTalentListAdvancement extends Advancement {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		type: "expandedTalentList",
		dataModels: {
			configuration: ImprovementConfigurationData
		},
		order: 45,
		icon: "systems/black-flag/artwork/advancement/improvement.svg",
		title: "BF.Advancement.ExpandedTalentList.Title",
		hint: "BF.Advancement.ExpandedTalentList.Hint"
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

	/**
	 * Summary that is used in class journal pages.
	 * @returns {string}
	 */
	async journalSummary() {
		const classDocument = await CONFIG.BlackFlag.registration.getSource("class", this.item.system.identifier.class);
		if ( !classDocument ) return "";

		const classImprovement = classDocument.system.advancement.byType("improvement")[0];
		const lists = [classImprovement?.configuration.talentList, this.configuration.talentList]
			.map(t => CONFIG.BlackFlag.talentCategories.localized[t])
			.filter(t => t);

		return `<p>${game.i18n.format("BF.Advancement.ExpandedTalentList.JournalDescription", {
			class: classDocument.name,
			classLowercase: classDocument.name.toLowerCase(),
			talentLists: game.i18n.getListFormatter({ type: "disjunction", style: "short" }).format(lists)
		})}</p>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static availableForItem(item) {
		return !item.system.advancement.byType(this.metadata.name).length;
	}
}
