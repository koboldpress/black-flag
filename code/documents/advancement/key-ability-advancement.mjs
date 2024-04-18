import { KeyAbilityConfigurationData, KeyAbilityValueData } from "../../data/advancement/key-ability-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that indicates the key & secondary ability on a class and sets the appropriate saving throw proficiencies
 * if the class is the character's original. **Can only be added to classes and each class can only have one.**
 */
export default class KeyAbilityAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "keyAbility",
				dataModels: {
					configuration: KeyAbilityConfigurationData,
					value: KeyAbilityValueData
				},
				order: 15,
				icon: "systems/black-flag/artwork/advancement/key-ability.svg",
				title: "BF.Advancement.KeyAbility.Title",
				hint: "BF.Advancement.KeyAbility.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get levels() {
		return [1];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	warningKey(levels) {
		return `${this.relativeID}.${levels.class}.no-key-ability`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareWarnings(levels, notifications) {
		if (this.configuredForLevel(levels)) return;
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`,
			section: "progression",
			level: "warn",
			message: game.i18n.localize("BF.Advancement.KeyAbility.Notification")
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		return !!this.value.selected;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	titleForLevel(levels, { flow = false } = {}) {
		if (flow && !this.configuredForLevel(levels)) return this.title;

		const localize = key => {
			const config = CONFIG.BlackFlag.abilities[key];
			if (!key || !config) return "";
			return game.i18n.localize(config.labels.abbreviation).toUpperCase();
		};

		const options = flow && this.value.selected ? [this.value.selected] : this.configuration.options;
		const key = Array.from(options).map(localize).join("/");
		const secondary = localize(this.configuration.secondary);
		const abilities = [key, secondary].filter(a => a);
		if (!abilities.length) return this.title;

		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "conjunction", style: "short" });
		return `${this.title}: <em>${listFormatter.format(abilities)}</em>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Summary that is used in class journal pages.
	 * @returns {string}
	 */
	journalSummary() {
		const localize = key => {
			const config = CONFIG.BlackFlag.abilities[key];
			if (!key || !config) return "";
			return game.i18n.localize(config.labels.abbreviation).toUpperCase();
		};

		let first;
		let second = localize(this.configuration.secondary);
		if (this.configuration.options.size > 1) {
			first = second;
			const choiceListFormatter = new Intl.ListFormat(game.i18n.lang, { type: "disjunction", style: "short" });
			second = game.i18n.format("BF.JournalPage.Class.Traits.SavesChoice", {
				choices: choiceListFormatter.format(this.configuration.options.map(o => localize(o)))
			});
		} else {
			first = localize(this.configuration.options.first());
		}

		const abilities = [first, second].filter(a => a);
		if (!abilities.length) return "";
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit", style: "short" });
		return listFormatter.format(abilities);
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
	changes(levels) {
		const isOriginalClass = this.item.actor.system.progression.classes[this.item.identifier].originalClass;
		if (!this.configuredForLevel(levels) || !isOriginalClass) return;
		return [
			{
				key: `system.abilities.${this.value.selected}.save.proficiency.multiplier`,
				mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
				value: 1
			},
			{
				key: `system.abilities.${this.configuration.secondary}.save.proficiency.multiplier`,
				mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
				value: 1
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		if (initial) {
			if (this.configuration.options.size !== 1) return;
			data = this.configuration.options.first();
		}
		if (!data) return;

		return await this.actor.update({ [`${this.valueKeyPath}.selected`]: data }, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		return await this.actor.update({ [`${this.valueKeyPath}.-=selected`]: null }, { render });
	}
}
