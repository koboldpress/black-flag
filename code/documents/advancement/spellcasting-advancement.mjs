import SpellcastingTemplate from "../../data/actor/templates/spellcasting-template.mjs";
import { SpellcastingConfigurationData, SpellcastingValueData } from "../../data/advancement/spellcasting-data.mjs";
import { linkForUUID, Search } from "../../utils/_module.mjs";
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
				hint: "BF.Advancement.Spellcasting.Hint",
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
		return false;
		// TODO: Implement replacement
		// if (level <= this.level.value) return false;
		// return this.configuration.spells.replacement && this.configuration.spells.mode === "limited";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		const level = this.relavantLevel(levels);
		return !!this.value.added?.[level]?.length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a table with spellcasting details for this item.
	 * @returns {object}
	 */
	generateSpellcastingTable() {
		const table = { rows: [] };

		/**
		 * A hook event that fires to generate the table for custom spellcasting types.
		 * The actual hook names include the spellcasting type (e.g. `blackFlag.buildPsionicSpellcastingTable`).
		 * @param {object} table - Table definition being built. *Will be mutated.*
		 * @param {Item5e} item - Class for which the spellcasting table is being built.
		 * @param {SpellcastingConfigurationData} spellcasting - Spellcasting configuration.
		 * @function blackFlag.buildSpellcastingTable
		 * @memberof hookEvents
		 */
		if (
			Hooks.call(`blackFlag.build${this.type.capitalize()}SpellcastingTable`, table, this.item, this.configuration) ===
			false
		)
			return table;

		const slots = {};
		Array.fromRange(CONFIG.BlackFlag.maxSpellCircle, 1).forEach(l => (slots[`circle-${l}`] = {}));

		let largestSlot;
		for (const level of Array.fromRange(CONFIG.BlackFlag.maxLevel, 1).reverse()) {
			const progression = { leveled: 0 };
			SpellcastingTemplate.computeClassProgression(progression, this.item, {
				levels: level,
				spellcasting: this.configuration
			});
			SpellcastingTemplate.prepareSpellcastingSlots(slots, "leveled", progression);

			if (!largestSlot)
				largestSlot = Object.values(slots).reduce(
					(slot, data) => (data.max && data.circle > slot ? data.circle : slot),
					-1
				);

			table.rows.push(
				Array.fromRange(largestSlot, 1).map(circle => {
					return { class: "spell-slots", content: slots[`circle-${circle}`]?.max || "&mdash;" };
				})
			);
		}

		// Prepare headers & columns
		const circles = CONFIG.BlackFlag.spellCircles();
		table.headers = [Array.fromRange(largestSlot, 1).map(circle => ({ content: circles[circle] }))];
		table.cols = [{ class: "spellcasting", span: largestSlot }];
		table.rows.reverse();

		return table;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Details on how many spells of each type there are to learn for a level.
	 * @param {AdvancementLevels} levels - Level for which to get the details.
	 * @returns {Map<string, { learned: number, total: number }>}
	 */
	statsForLevel(levels) {
		const level = this.relavantLevel(levels);
		const isFirstLevel = level === this.level.value;
		const stats = new Map([
			["cantrips", {}],
			["rituals", {}],
			["spells", {}],
			["special", {}],
			["spellbook:free", {}],
			["spellbook:paid", {}],
			["replacement", {}],
			["auto", {}]
		]);
		stats.needToLearn = false;

		for (const type of ["cantrips", "rituals", "spells"]) {
			const scale = this.configuration[type].scaleValue;
			stats.get(type).total = (scale?.valueForLevel(level)?.value ?? 0) - (scale?.valueForLevel(level - 1)?.value ?? 0);
			stats.get(type).learned = 0;
			if (type === "spells" && isFirstLevel && this.configuration.spells.special) {
				stats.get(type).total -= 1;
				stats.get("special").total = 1;
			}
		}

		if (this.configuration.spells.mode === "spellbook") {
			stats.get("spellbook:free").total = isFirstLevel
				? this.configuration.spells.spellbook.firstLevel
				: this.configuration.spells.spellbook.otherLevels;
		}

		if (this.replacesSpellAt(level)) stats.get("replacement").total = 1;

		const replacedSpells = new Set(this.value.replaced?.[level]?.map(s => s.replacement?.id));

		for (const data of this._getAddedSpells(levels)) {
			if (replacedSpells.has(data.uuid) || !stats.get(data.slot)) continue;
			stats.get(data.slot).learned ??= 0;
			stats.get(data.slot).learned += 1;
		}

		for (const data of stats.values()) {
			data.total ??= 0;
			data.learned ??= 0;
			data.toLearn = data.total - data.learned;
			if (data.toLearn) stats.needToLearn = true;
		}

		return stats;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		if (!flow) return this.configuration.label;
		const level = this.relavantLevel(levels);
		const changes = [];
		for (const spell of this._getAddedSpells(levels)) {
			const doc = this.actor.items.get(spell.document) ?? fromUuidSync(spell.uuid);
			if (doc && spell.slot !== "auto") changes.push(linkForUUID(doc.uuid));
			// TODO: Distinguish replacement spells
		}
		if (this.gainsSpellsAt(level)) {
			const circle = this.computeMaxCircle(level);
			changes.push(
				`<span class="choice-name">${game.i18n.format("BF.Advancement.Spellcasting.CircleSpells", {
					circle: CONFIG.BlackFlag.spellCircles()[circle]
				})}`
			);
		}
		return changes.map(c => `<span class="choice-entry">${c}</span>`).join(" ");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		const level = this.relavantLevel(levels);
		const added = this._getAddedSpells(levels) ?? [];

		if (data) {
			await this.createSpells(data.added ?? [], { added, data });
			return await this.actor.update(
				{
					[`${this.valueKeyPath}.added.${level}`]: added
				},
				{ render }
			);
			// TODO: Handle replacement
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
			await this.createSpells(
				spells.filter(s => !existingSpells.has(s.uuid)).map(s => ({ uuid: s.uuid, slot: "auto" })),
				{ added, data }
			);
			return await this.actor.update(
				{
					[`${this.valueKeyPath}.added.${level}`]: added
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
			if (data.deleteIds?.size) {
				await this.actor.deleteEmbeddedDocuments("Item", Array.from(data.deleteIds), { render: false });
				return await this.actor.update(
					{
						[`${this.valueKeyPath}.added.${level}`]: this._getAddedSpells(levels).filter(
							a => !data.deleteIds.has(a.document)
						)
					},
					{ render }
				);
			}
		}

		// Remove all spells for this level
		else {
			deleteIds = (this.value.added?.[level] ?? []).map(d => d.document?.id).filter(i => i);
			await this.actor.deleteEmbeddedDocuments("Item", deleteIds, { render: false });
			return await this.actor.update(
				{
					[`${this.valueKeyPath}.added.-=${level}`]: null
				},
				{ render }
			);

			// TODO: Restore any replaced spells
		}
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
		for (const [index, data] of uuids.entries()) {
			const origin = { source: this.configuration.source, identifier: this.item.identifier };
			const spellData = await this.createItemData(data.uuid, {
				changes: { [`flags.${game.system.id}.relationship`]: { mode: "standard", origin } },
				data,
				index
			});
			if (
				foundry.utils.getProperty(spellData, "system.circle.base") > 0 &&
				!CONFIG.BlackFlag.spellLearningModes[this.configuration.spells.mode]?.prepared
			) {
				foundry.utils.setProperty(spellData, `flags.${game.system.id}.relationship.alwaysPrepared`, true);
			}
			if (!spellData) continue;
			spells.push(spellData);
			added.push({ document: spellData._id, ...data });
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

		const TABLE = CONFIG.BlackFlag.spellSlotTable;
		switch (type) {
			case "leveled":
				const divisor = CONFIG.BlackFlag.spellcastingTypes.leveled.progression[progression]?.divisor ?? 1;
				const leveledRow = TABLE[Math.clamp(Math.ceil(level / divisor), 0, TABLE.length - 1)];
				if (leveledRow?.length) data.circle = leveledRow.length - 1;
				break;
			case "pact":
				const pactRow = TABLE[Math.clamp(Math.ceil(level / 2), 0, TABLE.length - 1)];
				if (pactRow?.length) data.circle = pactRow.length - 1;
				break;
		}

		return data.circle;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get an adjusted version of the added data for a level that takes manually deleted spells into account.
	 * @param {AdvancementLevels} levels - Levels for which to fetch the data.
	 * @returns {LearnedSpellData[]}
	 */
	_getAddedSpells(levels) {
		const valueSource = foundry.utils.getProperty(this.actor?.toObject() ?? {}, this.valueKeyPath) ?? {};
		const level = this.relavantLevel(levels);
		const added = foundry.utils.deepClone(valueSource.added?.[level]);
		if (!added) return [];

		const replaced = Object.values(valueSource.replaced ?? {})
			.flat()
			.filter(r => r.level === level)
			.map(r => r.original);

		for (const a of added) {
			if (replaced.includes(a.document)) a.replaced = true;
		}

		const existing = this._getExistingSpells();
		return added.filter(a => a.replaced || existing.has(a.uuid));
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
