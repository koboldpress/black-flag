import { ImprovementConfigurationData } from "../../data/advancement/improvement-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that allows player to access a second talent list when taking an improvement.
 * **Can only be added to subclasses and each subclass can only have one.**
 */
export default class ExpandedTalentListAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "expandedTalentList",
				dataModels: {
					configuration: ImprovementConfigurationData
				},
				order: 45,
				icon: "systems/black-flag/artwork/advancement/improvement.svg",
				title: "BF.Advancement.ExpandedTalentList.Title",
				hint: "BF.Advancement.ExpandedTalentList.Hint",
				singleton: true
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get levels() {
		return [3];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		const entries = Array.from(this.configuration.talentList).map(
			e =>
				`<span class="choice-entry"><span class="choice-name">${CONFIG.BlackFlag.talentCategories.localizedPlural[e]}</span></span>`
		);
		return entries.join("\n");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Summary that is used in class journal pages.
	 * @returns {string}
	 */
	async journalSummary() {
		const classDocument = await CONFIG.BlackFlag.registration.getSource("class", this.item.system.identifier.class);
		if (!classDocument) return "";

		const classImprovement = classDocument.system.advancement.byType("improvement")[0];
		const lists = Array.from(
			new Set([...(classImprovement?.configuration.talentList ?? []), ...this.configuration.talentList])
		)
			.map(t => CONFIG.BlackFlag.talentCategories.localizedDescription[t])
			.filter(t => t);

		return `<p>${game.i18n.format("BF.Advancement.ExpandedTalentList.JournalDescription", {
			class: classDocument.name,
			classLowercase: classDocument.name.toLowerCase(),
			talentLists: game.i18n.getListFormatter({ type: "disjunction", style: "short" }).format(lists)
		})}</p>`;
	}
}
