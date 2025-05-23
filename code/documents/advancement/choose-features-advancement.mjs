import {
	ChooseFeaturesConfigurationData,
	ChooseFeaturesValueData
} from "../../data/advancement/choose-features-data.mjs";
import { linkForUUID, log } from "../../utils/_module.mjs";
import GrantFeaturesAdvancement from "./grant-features-advancement.mjs";

/**
 * Advancement that presents the player with a choice of multiple items that they can take. Keeps track of which
 * items were selected at which levels.
 */
export default class ChooseFeaturesAdvancement extends GrantFeaturesAdvancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "chooseFeatures",
				dataModels: {
					configuration: ChooseFeaturesConfigurationData,
					value: ChooseFeaturesValueData
				},
				order: 50,
				icon: "systems/black-flag/artwork/advancement/choose-features.svg",
				title: "BF.Advancement.ChooseFeatures.Title",
				hint: "BF.Advancement.ChooseFeatures.Hint",
				multiLevel: true
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static VALID_TYPES = new Set(["feature", "talent"]);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get levels() {
		return Object.keys(this.configuration.choices).map(k => Number(k));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	warningKey(levels) {
		return `${this.relativeID}.${this.relavantLevel(levels)}.choice-required`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareWarnings(levels, notifications) {
		const choicesNeeded = this.choicesRequired(this.relavantLevel(levels));
		if (choicesNeeded <= 0) return;
		const pluralRules = new Intl.PluralRules(game.i18n.lang);
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`,
			section: "progression",
			level: "warn",
			message: game.i18n.format(`BF.Advancement.ChooseFeatures.Notification[${pluralRules.select(choicesNeeded)}]`, {
				title: this.title,
				number: choicesNeeded
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Number of choices that still need to be made for the specified level.
	 * @param {number} level
	 * @returns {number}
	 */
	choicesRequired(level) {
		return (this.configuration.choices[level]?.count ?? 0) - (this.value.added?.[level]?.length ?? 0);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		return this.choicesRequired(this.relavantLevel(levels)) <= 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	titleForLevel(levels, { flow = false } = {}) {
		const data = this.configuration.choices[this.relavantLevel(levels)] ?? {};
		let tag;
		if (data.count) tag = game.i18n.format("BF.Advancement.ChooseFeatures.Choose", { number: data.count });
		else if (data.replacement) tag = game.i18n.localize("BF.Advancement.ChooseFeatures.Replacement.Title");
		else return this.title;
		return `${this.title} <span class="choice-count">(${tag.toLowerCase()})</span>`;
		// TODO: Use type & restriction to auto-generate title
		// Then display as "Choose _" in advancement list and "_ (choose 1)" in flow
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		const items = this.value.added?.[this.relavantLevel(levels)];
		if (!items || !flow) return this.hint ?? "";
		return Object.values(items).reduce((html, data) => html + linkForUUID(data.uuid), "");
		// TODO: Cross out replaced features
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	storagePath(level) {
		return `added.${level}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		if (initial || !data?.choices?.length) return;
		const level = this.relavantLevel(levels);

		const existing = foundry.utils.getProperty(this.value._source, this.storagePath(level)) ?? [];
		const added = await this.createItems(data.choices, { added: existing });
		const valueData = { [`${this.valueKeyPath}.${this.storagePath(level)}`]: added };

		if (!this.configuration.choices[level]?.replacement) data.replaces = null;
		const original = this.actor.items.get(data.replaces);
		if (added.length && original) {
			const replacedLevel = Object.entries(this.value.added)
				.reverse()
				.reduce((level, [l, added]) => {
					if (added.find(a => a.document === original) && Number(l) > level) return Number(l);
					return level;
				}, -Infinity);
			if (Number.isFinite(replacedLevel)) {
				await this.actor.deleteEmbeddedDocuments("Item", [data.replaces], { render: false });
				valueData[`${this.valueKeyPath}.replaced.${level}`] = {
					level: replacedLevel,
					original: original.id,
					replacement: added[0].document
				};
			}
		}

		return await this.actor.update(valueData, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async reverse(levels, data, { render = true } = {}) {
		if (!data) return super.reverse(levels);
		const level = this.relavantLevel(levels);

		const keyPath = this.storagePath(level);
		const addedCollection = foundry.utils.getProperty(this.value._source, keyPath).filter(a => a.document !== data);
		await this.actor.deleteEmbeddedDocuments("Item", [data], { render: false });
		const valueData = { [`${this.valueKeyPath}.${keyPath}`]: addedCollection };

		const replaced = this.value.replaced[level];
		const uuid = this.value._source.added?.[replaced?.level]?.find(d => d.document === replaced.original)?.uuid;
		if (uuid) {
			const itemData = await this.createItemData(uuid, { data, id: replaced.original });
			await this.actor.createEmbeddedDocuments("Item", [itemData], { keepId: true, render: false });
			valueData[`${this.valueKeyPath}.replaced.-=${level}`] = null;
		}

		return await this.actor.update(valueData, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Verify that the provided item can be used with this advancement based on the configuration.
	 * @param {BlackFlagItem} item - Item that needs to be tested.
	 * @param {object} config
	 * @param {boolean} [config.flow=false] - Is this restriction being done during the flow process?
	 * @param {string} [config.type] - Type restriction on this advancement.
	 * @param {object} [config.restriction] - Additional restrictions to be applied.
	 * @param {boolean} [config.strict=true] - Should an error be thrown when an invalid type is encountered?
	 * @returns {boolean} - Is this type valid?
	 * @throws An error if the item is invalid and strict is `true`.
	 */
	_validateItemType(item, { flow = false, type, restriction, strict = true } = {}) {
		super._validateItemType(item, { strict });
		type ??= this.configuration.type;
		restriction ??= this.configuration.restriction;

		// Type restriction is set and the item type does not match the selected type
		if (type && type !== item.type) {
			const typeLabel = game.i18n.localize(CONFIG.Item.typeLabels[type]);
			if (strict) throw new Error(game.i18n.format("BF.Advancement.ChooseFeatures.Warning.Type", { type: typeLabel }));
			return false;
		}

		// If additional type restrictions applied, make sure they are valid
		if (type === "feature" && restriction.category) {
			const categoryConfig = CONFIG.BlackFlag.featureCategories[restriction.category];
			const typeConfig = categoryConfig.types?.[restriction.type];
			let errorLabel;
			if (restriction.category !== item.system.type.category) errorLabel = categoryConfig.localization;
			else if (typeConfig && restriction.type !== item.system.type.value) errorLabel = typeConfig.localization;
			if (errorLabel) {
				if (strict)
					throw new Error(
						game.i18n.format("BF.Advancement.ChooseFeatures.Warning.Type", {
							type: game.i18n.localize(`${errorLabel}[other]`).toLowerCase()
						})
					);
				return false;
			}
		}

		// Check restrictions defined by the dropped item
		if (this.actor && flow) {
			const messages = item.system.validatePrerequisites(this.actor);
			if (messages !== true && messages !== null) {
				if (strict) {
					const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "conjunction", style: "long" });
					throw new Error(
						game.i18n.format("BF.Prerequisite.Warning.Failure", {
							name: this.actor.name,
							requirements: listFormatter.format(messages),
							type: game.i18n.localize(CONFIG.Item.typeLabels[item.type]).toLowerCase()
						})
					);
				}
				return false;
			}
		}

		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Produce a list of items that can be chosen.
	 * @returns {BlackFlagItem[]}
	 */
	async choices() {
		const choices = [];
		for (const c of Object.values(this.configuration.pool)) {
			const item = await fromUuid(c.uuid);
			if (!item) {
				log(`Choice document could not be found: ${uuid}`, { level: "warn" });
				continue;
			}
			if (!this.selectionLimitReached(item)) choices.push(item);
		}
		return choices;
	}
}
