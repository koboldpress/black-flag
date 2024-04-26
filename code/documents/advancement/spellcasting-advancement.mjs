import { SpellcastingConfigurationData, SpellcastingValueData } from "../../data/advancement/spellcasting-data.mjs";
import { Search } from "../../utils/_module.mjs";
import Advancement from "./advancement.mjs";

export default class SpellcastingAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "spellcasting",
				dataModels: {
					configuration: SpellcastingConfigurationData,
					value: SpellcastingValueData
				},
				order: 35,
				icon: "systems/black-flag/artwork/advancement/spellcasting.svg",
				title: "BF.Advancement.Spellcasting.Title",
				hint: "BF.Advancement.Spellcasting.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get levels() {
		return Array.fromRange(CONFIG.BlackFlag.maxLevel, 1).filter(
			level =>
				level === this.level.value ||
				(this.actor && (this.replacesSpellAt(level) || this.gainsSpellsAt(level) || this.learnsSpellsAt(level)))
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this a level where you gain a new circle of spells?
	 * @param {number} level
	 * @returns {boolean}
	 */
	gainsSpellsAt(level) {
		if (level < this.level.value) return false;
		return this.configuration.spells.mode === "all" && this.computeMaxCircle(level) > this.computeMaxCircle(level - 1);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this a level where you can learn new spells?
	 * @param {number} level
	 * @returns {boolean}
	 */
	learnsSpellsAt(level) {
		if (level < this.level.value) return false;
		if (level in (this.configuration.cantrips.scaleValue?.configuration.scale ?? {})) return true;
		if (level in (this.configuration.rituals.scaleValue?.configuration.scale ?? {})) return true;
		switch (this.configuration.spells.mode) {
			case "limited":
				return level in (this.configuration.spells.scaleValue?.configuration.scale ?? {});
			case "spellbook":
				return this.configuration.spells.spellbook[level === this.level.value ? "firstLevel" : "otherLevels"] > 0;
		}
		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can a spell be replaced at this level?
	 * @param {number} level
	 * @returns {boolean}
	 */
	replacesSpellAt(level) {
		if (level <= this.level.value) return false;
		return this.configuration.spells.replacement && this.configuration.spells.mode === "limited";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		const level = this.relavantLevel(levels);
		return !!this.value.added?.[level]?.length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		if (!flow) return this.configuration.label;
		const level = this.relavantLevel(levels);
		const changes = [];
		if (this.gainsSpellsAt(level)) {
			const circle = this.computeMaxCircle(level);
			changes.push(
				game.i18n.format("BF.Advancement.Spellcasting.CircleSpells", {
					circle: CONFIG.BlackFlag.spellCircles()[circle]
				})
			);
		}
		// TODO: Display spells learned & replaced
		return game.i18n.getListFormatter({ type: "unit" }).format(changes);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		const level = this.relavantLevel(levels);

		if (data) {
			// TODO: Add & replace spells as necessary
			// Any spells that aren't in the spellbook in "standard" or "always" prepared mode, add
			// Any spells that are in the spellbook, add this class to list
			// Any replaced spells, swap
		}

		// Gain all spells of a certain circle
		else if ((initial || !data) && this.gainsSpellsAt(level)) {
			const existingSpells = this._getExistingSpells();
			const spells = await Search.compendiums(Item, {
				type: "spell",
				filters: [
					{ k: "system.source", o: "has", v: "divine" },
					{ k: "system.circle.base", v: this.computeMaxCircle(level) },
					{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
				]
			});
			const added = await this.createSpells(
				spells.filter(s => !existingSpells.has(s.uuid)).map(s => ({ uuid: s.uuid, slot: null })),
				{ data }
			);
			return await this.actor.update(
				{
					[`${this.valueKeyPath}.added.${this.relavantLevel(levels)}`]: added
				},
				{ render }
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		let deleteIds;
		const level = this.relavantLevel(levels);

		// Remove a specific selected spell
		if (data) {
			// TODO
		}

		// Remove all spells for this level
		else {
			deleteIds = (this.value.added[level] ?? []).map(d => d.document?.id).filter(i => i);
		}

		// TODO: Restore any replaced spells

		await this.actor.deleteEmbeddedDocuments("Item", deleteIds, { render: false });
		return await this.actor.update(
			{
				[`${this.valueKeyPath}.added.-=${level}`]: null
			},
			{ render }
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply the appropriate changes to the spells before adding them to the sheet.
	 * @param {string[]} uuids - UUIDs of spells to create.
	 * @param {object} [options={}]
	 * @param {object[]} [options.added=[]] - Existing granted spells.
	 * @param {object} [options.data] - Data from the advancement process.
	 * @param {boolean} [options.render=false] - Should the update re-render the actor?
	 * @returns {object[]} - Array of data for storing in value.
	 */
	async createSpells(uuids, { added = [], data, render = false } = {}) {
		const spells = [];
		for (const [index, { uuid, slot }] of uuids.entries()) {
			const origin = { identifier: this.item.identifier };
			if (slot?.special) origin.special = true;
			if (slot?.type === "spellbook") origin.spellbookOrigin = "free";
			const spellData = await this.createItemData(uuid, {
				changes: { [`flags.${game.system.id}.relationship`]: { mode: "standard", origin } },
				data,
				index
			});
			if (
				foundry.utils.getProperty(spellData, "system.circle.base" > 0) &&
				!CONFIG.BlackFlag.spellLearningModes[this.configuration.spells.mode]?.prepared
			) {
				foundry.utils.setProperty(spellData, `flags.${game.system.id}.relationship.alwaysPrepared`, true);
			}
			if (!spellData) continue;
			spells.push(spellData);
			added.push({ document: spellData._id, uuid });
		}
		await this.actor.createEmbeddedDocuments("Item", spells, { keepId: true, keepRelationship: true, render });
		return added;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Highest circle of spells available depending on spellcasting type and progression.
	 * @param {number} level - Class level to use for calculating the max circle.
	 * @returns {number|null}
	 */
	computeMaxCircle(level) {
		const data = { circle: null };
		const { type, progression } = this.configuration;

		/**
		 * A hook event that fires while determining the max circle available for a specific spellcasting method.
		 * @param {object} data
		 * @param {number} data.circle - The maximum allowed circle.
		 * @param {number} level - Class level to use for calculating the max circle.
		 * @param {string} progression - Spellcasting progression type.
		 * @param {SpellcastingAdvancement} spellcasting - The spellcasting advancement.
		 * @function blackFlag.computeSpellcastingMaxCircle
		 * @memberof hookEvents
		 */
		Hooks.callAll(`blackFlag.compute${type.capitalize()}MaxCircle`, data, level, progression, this);

		if (data.circle) return data.circle;

		switch (type) {
			case "leveled":
				const divisor = CONFIG.BlackFlag.spellcastingTypes.leveled.progression[progression]?.divisor ?? 1;
				const row =
					CONFIG.BlackFlag.spellSlotTable[
						Math.clamp(Math.floor(level / divisor), 0, CONFIG.BlackFlag.spellSlotTable.length - 1)
					];
				if (row?.length) data.circle = row.length - 1;
				break;
		}

		return data.circle;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine what spells are already on the sheet in standard preparation mode.
	 * @returns {Set<string>} - Set of spell UUIDs that already exist.
	 * @internal
	 */
	_getExistingSpells() {
		const existingSpells = new Set();
		if (!this.actor) return existingSpells;
		for (const spell of this.actor.items) {
			if (spell.type !== "spell") continue;
			const { mode } = spell.getFlag(game.system.id, "relationship") ?? {};
			if (!["standard", undefined].includes(mode)) continue;
			const sourceId =
				foundry.utils.getProperty(spell, "_stats.compendiumSource") ??
				foundry.utils.getProperty(spell, "flags.core.sourceId") ??
				foundry.utils.getProperty(spell, "flags.black-flag.sourceId");
			existingSpells.add(sourceId);
		}
		return existingSpells;
	}
}
