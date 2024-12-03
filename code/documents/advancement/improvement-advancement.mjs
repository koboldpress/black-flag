import { ImprovementConfigurationData, ImprovementValueData } from "../../data/advancement/improvement-data.mjs";
import { getPluralRules, linkForUUID, numberFormat, Search } from "../../utils/_module.mjs";
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
		if (this.configuredForLevel(levels)) return;
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
		return (
			(this.value.ability.one && this.value.ability.two) ||
			((this.value.ability.one || this.value.ability.two) && !foundry.utils.isEmpty(this.value.talent))
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbedContents(config, options) {
		const p = document.createElement("p");
		p.innerHTML = this.hint ?? "";
		return p;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		const p1 = numberFormat(1, { sign: true });
		const p2 = numberFormat(2, { sign: true });

		if (flow) {
			const choices = [];
			const pushAbility = (value, number, key = "ability") =>
				choices.push([
					`<span class="choice-name">${CONFIG.BlackFlag.abilities.localized[value]} ${number}</span>`,
					key
				]);
			if (this.value.ability.one && this.value.ability.one === this.value.ability.two) {
				pushAbility(this.value.ability.one, p2);
			} else {
				if (this.value.ability.one)
					pushAbility(this.value.ability.one, p1, this.value.ability.two ? "ability.one" : undefined);
				if (this.value.ability.two)
					pushAbility(this.value.ability.two, p1, this.value.ability.one ? "ability.two" : undefined);
			}
			if (this.value.talent?.document) choices.push([linkForUUID(this.value.talent.document.uuid), "talent"]);
			const displayDelete = this.actor.sheet.modes.editing || !this.configuredForLevel(levels);
			return choices
				.map(
					([label, key]) =>
						`<span class="choice-entry">${label}${
							displayDelete
								? `
								<button type="button" class="link-button" data-action="remove-choice" data-key="${key}"
								        data-tooltip="BF.Advancement.Improvement.Action.Revert"
												aria-label="${game.i18n.localize("BF.Advancement.Improvement.Action.Revert")}">
									<i class="fa-solid fa-trash" inert></i>
								</button>
								`
								: ""
						}</span>`
				)
				.join(" ");
		} else {
			const choices = [
				`${game.i18n.localize("BF.Ability.Label[one]")} ${p1}`,
				...Array.from(this.configuration.talentList).map(e => CONFIG.BlackFlag.talentCategories.localizedPlural[e])
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
		let lists = Array.from(this.configuration.talentList).map(
			t => CONFIG.BlackFlag.talentCategories.localizedDescription[t]
		);
		return game.i18n.format("BF.Advancement.Improvement.Journal.Description", {
			talentList: game.i18n.format(
				`BF.Advancement.Improvement.Journal.TalentList[${getPluralRules().select(lists.length)}]`,
				{
					lists: game.i18n.getListFormatter({ type: "disjunction" }).format(lists)
				}
			)
		});
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
		const changes = [];
		if (this.value.ability.one)
			changes.push({
				key: `system.abilities.${this.value.ability.one}.value`,
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: 1
			});
		if (this.value.ability.two)
			changes.push({
				key: `system.abilities.${this.value.ability.two}.value`,
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: 1
			});
		if (changes.length) return changes;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		if (initial) return;

		if (data.ability) {
			const ability = data.ability;
			data.ability = {};
			if (!this.value.ability?.one) data.ability.one = ability;
			else if (!this.value.ability?.two) data.ability.two = ability;
		}

		if (data.talent?.choice) {
			const added = await this.createItems([data.talent.choice]);
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
		else if (data?.key === "ability.one") valueUpdates["ability.-=one"] = null;
		else if (data?.key === "ability.two") valueUpdates["ability.-=two"] = null;

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
		let filters;
		if (!this.actor.getFlag(game.system.id, "unrestrictedTalents")) {
			const subclass = this.actor.system.progression.classes[this.item.identifier].subclass;
			const expandedTalentList = subclass?.system.advancement.byType("expandedTalentList")[0];
			filters = [
				{
					k: "system.type.category",
					o: "in",
					v: new Set([...this.configuration.talentList, ...(expandedTalentList?.configuration.talentList ?? [])])
				}
			];
		}
		return ((await Search.compendiums(Item, { type: "talent", filters, index: false })) ?? []).filter(
			i => i.system.restriction?.allowMultipleTimes || !this.actor?.sourcedItems.get(i.uuid)?.size
		);
	}
}
