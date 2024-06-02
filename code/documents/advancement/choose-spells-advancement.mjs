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
			...(await this.createItems(addUuids, { added: existing, data })),
			...(await GrantSpellsAdvancement.prototype.updateItems.call(this, updateIds, { data }))
		];
		return await this.actor.update(
			{
				[this.valueKeyPath]: {
					ability: data.ability,
					[this.storagePath(level)]: added
				}
			},
			{ render }
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async reverse(levels, data, { render = true } = {}) {
		if (!data) return GrantSpellsAdvancement.prototype.reverse.call(this, levels);
		const keyPath = this.storagePath(this.relavantLevel(levels));
		let addedCollection = foundry.utils.getProperty(this.value._source, keyPath);
		const entry = addedCollection.find(a => a.document === data);
		addedCollection = addedCollection.filter(a => a.document !== data);
		if (entry.modified) {
			await this.actor.updateEmbeddedDocuments(
				"Item",
				{
					_id: data,
					...this.configuration.spell.getReverseChanges(entry.document, data)
				},
				{ render: false }
			);
		} else {
			await this.actor.deleteEmbeddedDocuments("Item", [data], { render: false });
		}
		return await this.actor.update({ [`${this.valueKeyPath}.${keyPath}`]: addedCollection }, { render });
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

		// Check circle restriction
		const circles = CONFIG.BlackFlag.spellCircles();
		if (restriction.circle === -1 && this.actor) {
			if (item.system.circle.base > this.actor.system.spellcasting.maxCircle) {
				if (strict)
					throw new Error(
						game.i18n.format("BF.Advancement.ChooseSpells.Warning.CircleAvailable", {
							circle: circles[this.actor.system.spellcasting.maxCircle]
						})
					);
				return false;
			} else if (!restriction.allowCantrips && item.system.circle.base === 0) {
				if (strict) throw new Error(game.i18n.localize("BF.Advancement.ChooseSpells.Warning.NoCantrips"));
				return false;
			}
		} else if (restriction.circle !== -1 && item.system.circle.base !== restriction.circle) {
			if (strict)
				throw new Error(
					game.i18n.format(
						`BF.Advancement.ChooseSpells.Warning.${!restriction.circle ? "OnlyCantrips" : "CircleSpecific"}`,
						{ circle: CONFIG.BlackFlag.spellCircles()[restriction.circle] }
					)
				);
			return false;
		}

		// Check ritual restriction
		if (!restriction.allowRituals && item.system.tags.has("ritual")) {
			if (strict) throw new Error(game.i18n.localize("BF.Advancement.ChooseSpells.Warning.NoRituals"));
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
