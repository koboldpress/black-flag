import { ImprovementConfigurationData, ImprovementValueData } from "../../data/advancement/improvement-data.mjs";
import { linkForUUID, numberFormat, search } from "../../utils/_module.mjs";
import GrantFeaturesAdvancement from "./grant-features-advancement.mjs";

/**
 * Advancement that allows player to increase one ability score and select a talent from a specific talent list.
 * **Can only be added to classes and each class can only have one.**
 */
export default class ImprovementAdvancement extends GrantFeaturesAdvancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "improvement",
				dataModels: {
					configuration: ImprovementConfigurationData,
					value: ImprovementValueData
				},
				order: 45,
				icon: "systems/black-flag/artwork/advancement/improvement.svg",
				title: "BF.Advancement.Improvement.Title",
				hint: "BF.Advancement.Improvement.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static VALID_TYPES = new Set(["talent"]);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	warningKey(levels) {
		return `${this.relativeID}.${levels.class}.no-improvement-*`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareWarnings(levels, notifications) {
		const baseKey = this.warningKey(levels).replace("-*", "");
		if (!this.value.ability)
			notifications.set(`${baseKey}-ability`, {
				category: `level-${levels.character}`,
				section: "progression",
				level: "warn",
				message: game.i18n.localize("BF.Advancement.Improvement.Notification.Ability")
			});
		if (foundry.utils.isEmpty(this.value.talent))
			notifications.set(`${baseKey}-talent`, {
				category: `level-${levels.character}`,
				section: "progression",
				level: "warn",
				message: game.i18n.localize("BF.Advancement.Improvement.Notification.Talent")
			});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_preCreate(data) {
		if (foundry.utils.hasProperty(data, "level")) return;
		this.updateSource({ "level.value": 4 });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		return this.value.ability && !foundry.utils.isEmpty(this.value.talent);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		const p1 = numberFormat(1, { sign: true });

		if (flow) {
			const choices = [];
			if (this.value.ability)
				choices.push([
					`<span class="choice-name">${CONFIG.BlackFlag.abilities.localized[this.value.ability]} ${p1}</span>`,
					"ability"
				]);
			if (this.value.talent?.document) choices.push([linkForUUID(this.value.talent.document.uuid), "talent"]);
			const displayDelete = this.actor.sheet.modes.editing || !this.configuredForLevel(levels);
			return choices
				.map(
					([label, key]) =>
						`<span class="choice-entry">${label}${
							displayDelete
								? ` <a data-action="remove-choice" data-key="${key}"><i class="fa-solid fa-trash"></i></a>`
								: ""
						}</span>`
				)
				.join(" ");
		} else {
			const choices = [
				`${game.i18n.localize("BF.Ability.Label[one]")} ${p1}`,
				CONFIG.BlackFlag.talentCategories.localized[this.configuration.talentList]
			];
			return choices.map(c => `<span class="choice-entry"><span class="choice-name">${c}</span></span>`).join(" ");
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Summary that is used in class journal pages.
	 * @returns {string}
	 */
	journalSummary() {
		return `<p>${game.i18n.format("BF.Advancement.Improvement.JournalDescription", {
			talentList: CONFIG.BlackFlag.talentCategories.localized[this.configuration.talentList],
			talentListPlural: CONFIG.BlackFlag.talentCategories.localizedPlural[this.configuration.talentList]
		})}</p>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static availableForItem(item) {
		return !item.system.advancement.byType(this.metadata.type).length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	storagePath(level) {
		return "talent";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	changes(levels) {
		if (!this.value.ability) return;
		return [
			{
				key: `system.abilities.${this.value.ability}.value`,
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: 1
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		if (initial) return;

		if (data.talent) {
			const added = await this.createItems([data.talent]);
			if (added[0]) data.talent = added[0];
			else delete data.talent;
		}

		return await this.actor.update({ [`${this.valueKeyPath}`]: data }, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		const valueUpdates = {};

		if (!data?.key || data?.key === "ability") valueUpdates["-=ability"] = null;
		if (!data?.key || data?.key === "talent") {
			await this.value.talent?.document?.delete();
			valueUpdates["-=talent"] = null;
		}

		return await this.actor.update({ [`${this.valueKeyPath}`]: valueUpdates }, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Produce a list of items that can be chosen.
	 * @returns {BlackFlagItem[]}
	 */
	async choices() {
		let filter = { k: "system.type.category", v: this.configuration.talentList };
		const subclass = this.actor.system.progression.classes[this.item.identifier].subclass;
		const expandedTalentList = subclass?.system.advancement.byType("expandedTalentList")[0];
		if (expandedTalentList)
			filter = {
				o: "OR",
				v: [filter, { k: "system.type.category", v: expandedTalentList.configuration.talentList }]
			};
		return search.compendiums(Item, { type: "talent", filters: [filter], index: false }) ?? [];
	}
}
