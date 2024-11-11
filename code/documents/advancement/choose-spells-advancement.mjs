import { ChooseSpellsConfigurationData, ChooseSpellsValueData } from "../../data/advancement/choose-spells-data.mjs";
import ChooseFeaturesAdvancement from "./choose-features-advancement.mjs";
import GrantFeaturesAdvancement from "./grant-features-advancement.mjs";
import GrantSpellsAdvancement from "./grant-spells-advancement.mjs";

/**
 * Advancement that presents the player with a choice of multiple spells that they can take. Keeps track of which
 * spells were selected at which levels.
 */
export default class ChooseSpellsAdvancement extends ChooseFeaturesAdvancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "chooseSpells",
				dataModels: {
					configuration: ChooseSpellsConfigurationData,
					value: ChooseSpellsValueData
				},
				order: 55,
				icon: "systems/black-flag/artwork/advancement/choose-spells.svg",
				title: "BF.Advancement.ChooseSpells.Title",
				hint: "BF.Advancement.ChooseSpells.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static VALID_TYPES = new Set(["spell"]);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	configuredForLevel(levels) {
		return (this.configuration.spell.ability.size <= 1 || this.value.ability) && super.configuredForLevel(levels);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data = {}, { initial = false, render = true } = {}) {
		if (initial) {
			if (this.configuration.spell.ability.size === 1) {
				await this.actor.update({ [this.valueKeyPath]: { ability: this.configuration.spell.ability.first() } });
			}
			return;
		}

		data.ability ??= this.value.ability;
		if (!data.ability) {
			if (this.configuration.spell.ability.size > 1) return;
			data.ability = this.configuration.spell.ability.first();
		}

		const level = this.relavantLevel(levels);
		const existing = foundry.utils.getProperty(this.value._source, this.storagePath(level)) ?? [];

		const addUuids = new Set();
		const updateIds = new Set();
		const mode = this.configuration.spell.mode;
		for (const uuid of data.choices ?? []) {
			const existing = this.actor.sourcedItems.get(uuid);
			const match = existing?.find(e => e.getFlag("black-flag", "relationship.mode") === mode);
			if (match) updateIds.add(match.id);
			else addUuids.add(uuid);
		}
		const added = [
			...(await this.createItems(Array.from(addUuids), { added: existing, data })),
			...(await GrantSpellsAdvancement.prototype.updateItems.call(this, updateIds, { data }))
		];
		const valueData = { [this.valueKeyPath]: { ability: data.ability, [this.storagePath(level)]: added } };

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
				const entry = this.value._source.added[replacedLevel];
				if (entry.modified)
					await this.actor.updateEmbeddedDocuments(
						"Item",
						[
							{
								_id: data.replaces,
								...this.configuration.spell.getReverseChanges(original, data)
							}
						],
						{ render: false }
					);
				else await this.actor.deleteEmbeddedDocuments("Item", [data.replaces], { render: false });
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
		if (!data) return GrantSpellsAdvancement.prototype.reverse.call(this, levels);
		const level = this.relavantLevel(levels);

		const keyPath = this.storagePath(level);
		let addedCollection = foundry.utils.getProperty(this.value._source, keyPath);
		const entry = addedCollection.find(a => a.document === data);
		addedCollection = addedCollection.filter(a => a.document !== data);
		if (entry.modified) {
			await this.actor.updateEmbeddedDocuments(
				"Item",
				[
					{
						_id: data,
						...this.configuration.spell.getReverseChanges(entry.document, data)
					}
				],
				{ render: false }
			);
		} else {
			await this.actor.deleteEmbeddedDocuments("Item", [data], { render: false });
		}
		const valueData = { [`${this.valueKeyPath}.${keyPath}`]: addedCollection };

		const replaced = this.value.replaced[level];
		const replacedEntry = this.value._source.added?.[replaced?.level]?.find(d => d.document === replaced.original);
		if (replacedEntry) {
			const existing = this.actor.items.get(replacedEntry.document);
			if (existing) {
				await GrantSpellsAdvancement.prototype.updateItems.call(this, [replacedEntry.document], {
					data: { ability: this.value.ability }
				});
			} else {
				const itemData = await this.createItemData(replacedEntry.uuid, { data, id: replaced.original });
				await this.actor.createEmbeddedDocuments("Item", [itemData], { keepId: true, render: false });
			}
			valueData[`${this.valueKeyPath}.replaced.-=${level}`] = null;
		}

		return await this.actor.update(valueData, { render });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async createItemData(uuid, options = {}) {
		options.changes = foundry.utils.mergeObject(
			this.configuration.spell.getApplyChanges(options.data),
			options.changes ?? {}
		);
		return super.createItemData(uuid, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_validateItemType(item, { type, restriction, strict = true } = {}) {
		GrantFeaturesAdvancement.prototype._validateItemType.call(this, item, { strict });
		restriction ??= this.configuration.restriction;
		restriction.circle = Number(restriction.circle);

		// No specific circle restriction, check max circle for class/character
		const circles = CONFIG.BlackFlag.spellCircles();
		if (restriction.circle === -1 && this.actor) {
			const classIdentifier =
				this.item.type === "class"
					? this.item.identifier
					: this.item.type === "subclass"
						? this.item.system.identifier.class
						: this.level.classIdentifier;
			const maxCircle =
				this.actor.system.spellcasting?.origins?.[classIdentifier]?.spellcasting.maxCircle ??
				this.actor.system.spellcasting?.maxCircle ??
				1;

			// Spell's circle is higher than max circle that can be cast
			if (item.system.circle.base > maxCircle) {
				if (strict)
					throw new Error(
						game.i18n.format("BF.Advancement.ChooseSpells.Warning.CircleMaximum", { circle: circles[maxCircle] })
					);
				return false;
			}
		}

		// Specific circle restriction
		else if (restriction.circle !== -1) {
			// Spell's circle is not equal to the specified circle
			if ((restriction.exactCircle || restriction.circle === 0) && item.system.circle.base !== restriction.circle) {
				if (strict)
					throw new Error(
						game.i18n.format(
							`BF.Advancement.ChooseSpells.Warning.${!restriction.circle ? "OnlyCantrips" : "CircleSpecific"}`,
							{ circle: circles[restriction.circle] }
						)
					);
				return false;
			}

			// Spell's circle is higher than specified circle
			else if (!restriction.exactCircle && item.system.circle.base > restriction.circle) {
				if (strict)
					throw new Error(
						game.i18n.format("BF.Advancement.ChooseSpells.Warning.CircleMaximum", {
							circle: circles[restriction.circle]
						})
					);
				return false;
			}
		}

		// Check ritual restriction
		if (restriction.circle !== 0) {
			if (restriction.allowRituals === "only" && !item.system.tags.has("ritual")) {
				if (strict) throw new Error(game.i18n.localize("BF.Advancement.ChooseSpells.Warning.OnlyRituals"));
				return false;
			} else if (!restriction.allowRituals && item.system.tags.has("ritual")) {
				if (strict) throw new Error(game.i18n.localize("BF.Advancement.ChooseSpells.Warning.NoRituals"));
				return false;
			}
		}

		// Check cantrip restriction
		if (!restriction.allowCantrips && item.system.circle.base === 0 && restriction.circle !== 0) {
			if (strict) throw new Error(game.i18n.localize("BF.Advancement.ChooseSpells.Warning.NoCantrips"));
			return false;
		}

		// Check source restriction
		if (restriction.source && !item.system.source.has(restriction.source)) {
			const source = CONFIG.BlackFlag.spellSources.localized[restriction.source];
			if (strict) throw new Error(game.i18n.format("BF.Advancement.ChooseSpells.Warning.Source", { source }));
			return false;
		}

		return true;
	}
}
