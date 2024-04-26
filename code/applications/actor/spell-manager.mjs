import { filter, numberFormat, search } from "../../utils/_module.mjs";

/**
 * Application for learning new spells.
 */
export default class SpellManager extends DocumentSheet {
	constructor(...args) {
		super(...args);

		// Figure out what spells are already on sheet
		this.existingSpells = new Set();
		const specialChosenOrigins = new Set();
		for (const spell of this.document.items) {
			if (spell.type !== "spell") continue;
			if (!["standard", "alwaysPrepared"].includes(spell.system.type.value)) continue;
			const sourceId = foundry.utils.getProperty(spell, "flags.core.sourceId");
			this.existingSpells.add(sourceId);
			const origin = spell.getFlag("black-flag", "relationship.origin");
			if (origin.special && origin.identifier) specialChosenOrigins.add(origin.identifier);
		}

		this.slots = [];
		const sources = new Map();

		// Iterate over each spellcasting source, calculating cantrips, rituals, & spells known
		for (const [identifier, origin] of Object.entries(this.document.system.spellcasting.origins)) {
			for (const type of ["cantrips", "rituals", "spells", "spellbook"]) {
				if (!origin[type]) continue;
				const diff = Math.max(origin[type].max - origin[type].value, 0);
				const needsSpecial =
					type === "spells" && origin.spellcasting.spells.special && !specialChosenOrigins.has(identifier);
				this.slots.push(
					...Array.fromRange(diff).map((s, i) => ({
						type,
						mode: "single",
						source: origin.document,
						special: i === 0 && needsSpecial,
						spellcasting: origin.spellcasting,
						selected: new Set()
					}))
				);
			}
			if (origin.spellcasting.spells.mode === "all" && !sources.has(origin.spellcasting.source)) {
				sources.set(origin.spellcasting.source, origin);
			}
		}

		// Prepare all learning slots
		const sourceSlots = [];
		for (const [source, label] of Object.entries(CONFIG.BlackFlag.spellSources.localized)) {
			const origin = sources.get(source);
			if (!origin) continue;
			for (const ring of Array.fromRange(this.document.system.spellcasting.maxRing, 1)) {
				sourceSlots.push({
					name: game.i18n.getListFormatter({ type: "unit" }).format([label, numberFormat(ring, { ordinal: true })]),
					type: "source",
					mode: "all",
					ring,
					source: origin.document,
					spellcasting: origin.spellcasting
				});
			}
		}

		// Group slots by type and then append typed slots
		this.slots.sort((lhs, rhs) => lhs.type.localeCompare(rhs.type, "en"));
		this.slots.push(...sourceSlots);

		// Begin fetching spells to display
		this.allSpells = search
			.compendiums(Item, {
				type: "spell",
				indexFields: new Set(["system.source", "system.school", "system.ring.base", "system.tags"])
			})
			.then(spells =>
				spells.reduce((map, spell) => {
					map.set(spell.uuid, spell);
					return map;
				}, new Collection())
			);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "spell-manager"],
			width: 775,
			height: 700,
			template: "systems/black-flag/templates/actor/spell-manager.hbs",
			resizable: true,
			scrollY: ["section.slots", "section.spells"],
			sheetConfig: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mapping of slot types to labels.
	 * @enum {string}
	 */
	static TYPE_LABELS = {
		cantrips: "BF.Spell.Ring.Cantrip[one]",
		rituals: "BF.Spell.Tag.Ritual.Label",
		spells: "BF.Item.Type.Spell[one]",
		spellbook: "BF.Spellbook.FreeSpell.Label[one]"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Indices of all spells that can potentially be added across all compendiums.
	 * @type {Promise<object[]>}
	 */
	allSpells;

	/**
	 * Set of sourceIds for spells already learned, not including those being added during this session.
	 * @type {Set<string>}
	 */
	existingSpells;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Currently selected slot.
	 * @type {SpellSlotData}
	 */
	get currentSlot() {
		return this.slots[this.selectedSlot];
	}

	/**
	 * Index of the currently selected slot.
	 * @type {number}
	 */
	selectedSlot = 0;

	/**
	 * Data representing a single spell learning slot.
	 * @typedef {object} SpellSlotData
	 *
	 * @property {cantrips|rituals|spells|spellbook|source} type - Type of spell that can be added to the slot.
	 * @property {single|all} mode - Whether only one spell or multiple can be selected.
	 * @property {BlackFlagItem} origin - Document with the spellcasting class that granted this slot.
	 * @property {Set<string>} selected - Set of UUIDs for selected spells, only one allowed in "single" mode.
	 * @property {string} [name] - Name to display for this slot.
	 * @property {number} [ring] - Spell ring (only used for "source" type).
	 */

	/**
	 * List of slots that need to be filled with spells.
	 * @type {SpellSlotData[]}
	 */
	slots;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return game.i18n.localize("BF.Spellbook.Title");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options = {}) {
		const context = await super.getData(options);
		if (!this.currentSlot) return context;
		const filters = this.prepareFilters();
		context.restrictions = this.prepareRestrictions(filters);

		const otherSelected = new Set();
		context.slots = this.slots.map((slot, index) => {
			slot.selected?.forEach(s => otherSelected.add(s));
			return {
				...slot,
				name: slot.name ?? this.constructor.TYPE_LABELS[slot.type],
				number: index + 1,
				selected: index === this.selectedSlot,
				spell: slot.mode === "single" ? fromUuidSync(slot.selected.first()) : null
			};
		});
		context.mode = this.currentSlot.mode;

		context.spells = (await this.allSpells).filter(
			s => !this.existingSpells.has(s.uuid) && filters && filter.performCheck(s, filters)
		);
		this.currentSlot.selected ??= new Set(context.spells.map(s => s.uuid));
		context.spells = context.spells.map(spell => ({
			...spell,
			disabled: !this.currentSlot?.selected.has(spell.uuid) && otherSelected.has(spell.uuid),
			selected: this.currentSlot?.selected.has(spell.uuid)
		}));

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the filters for spells in the current slot.
	 * @returns {FilterDescription[]|void}
	 */
	prepareFilters() {
		const filters = [];
		const schools = this.currentSlot.spellcasting.spells.schools;

		// Always restrict by source unless current slot is special and there are no schools set
		if (!this.currentSlot.special || schools.size) {
			filters.push({ k: "system.source", o: "has", v: this.currentSlot.spellcasting.source });
		}

		switch (this.currentSlot.type) {
			case "cantrips":
				// Cantrips are always ring 0
				filters.push({ k: "system.ring.base", v: 0 });
				break;
			case "rituals":
				filters.push(
					// Ring must be less than maximum
					{ k: "system.ring.base", o: "lte", v: this.document.system.spellcasting.maxRing },
					// Must be a ritual spell
					{ k: "system.tags", o: "has", v: "ritual" }
				);
				break;
			case "spells":
				// Add restriction on school if they are set and current slot isn't special
				if (schools.size && !this.currentSlot.special) filters.push({ k: "system.school", o: "in", v: schools });
			case "spellbook":
				filters.push(
					// No cantrips
					{ k: "system.ring.base", o: "gte", v: 1 },
					// Ring must be less than maximum
					{ k: "system.ring.base", o: "lte", v: this.document.system.spellcasting.maxRing },
					// No ritual spells
					{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
				);
				break;
			case "source":
				filters.push(
					// Source are always from a single ring
					{ k: "system.ring.base", v: this.currentSlot.ring },
					// No ritual spells
					{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
				);
				break;
			default:
				return;
		}

		return filters;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare displayed restrictions based on provided filters.
	 * @param {FilterDescription[]} filters
	 * @returns {object}
	 */
	prepareRestrictions(filters) {
		const restrictions = {};

		const source = filters.find(f => f.k === "system.source");
		if (source) restrictions.source = CONFIG.BlackFlag.spellSources.localized[source.v];

		const schools = filters.find(f => f.k === "system.school");
		if (schools)
			restrictions.schools = game.i18n.getListFormatter({ type: "disjunction" }).format(
				Array.from(schools.v)
					.map(s => CONFIG.BlackFlag.spellSchools.localized[s])
					.filter(s => s)
			);

		const ring = filters.find(f => f.k === "system.ring.base" && !f.o);
		const maxRing = filters.find(f => f.k === "system.ring.base" && f.o === "lte");
		if (ring?.v) restrictions.ring = CONFIG.BlackFlag.spellRings()[ring.v];
		else if (maxRing) restrictions.maxRing = CONFIG.BlackFlag.spellRings()[maxRing.v];

		return restrictions;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*  Event Listeners                    */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const [html] = jQuery;

		html.querySelector('[data-action="continue"]')?.addEventListener("click", this._onContinue.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle continuing to the next slot.
	 * @param {PointerEvent} event - Triggering event.
	 */
	_onContinue(event) {
		let nextIndex = this.selectedSlot;
		do {
			nextIndex += 1;
			if (nextIndex > this.slots.length - 1) nextIndex = 0;
		} while (this.slots[nextIndex]?.selected.size && nextIndex !== this.selectedSlot);
		this.selectedSlot = nextIndex;
		this.render();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeInput(event) {
		super._onChangeInput(event);

		switch (event.target.name) {
			case "selected-slot":
				this.selectedSlot = Number(event.target.value);
				return this.render();
			case "selected-spell":
				this.currentSlot.selected = new Set([event.target.value]);
				return this.render();
		}
		if (event.target.name.startsWith("selected.")) {
			const id = event.target.name.replace("selected.", "");
			if (event.target.checked) this.currentSlot.selected.add(id);
			else this.currentSlot.selected.delete(id);
			return this.render();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch a spell for a certain slot and mutate it with the appropriate data & flags for creation.
	 * @param {BlackFlagItem} spell - Spell to prepare.
	 * @param {SpellSlotData} slot - Slot this spell will be associated with.
	 * @returns {Promise<object>} - Data for document creation on the actor.
	 */
	async _prepareSpellData(spell, slot) {
		spell = await spell;
		const spellData = spell.toObject();
		const remote = spell.parent !== this.document;
		const origin = remote ? foundry.utils.getProperty(spellData, "flags.black-flag.relationship.origin") ?? {} : {};

		origin.identifier = slot.origin.identifier;
		if (slot.type === "spellbook") origin.spellbookOrigin = "free";
		if (slot.special) origin.special = true;

		const prepared =
			foundry.utils.getProperty(spellData, "system.ring.base") > 0
				? CONFIG.BlackFlag.spellLearningModes[slot.spellcasting.spells.mode]?.prepared
				: true;
		foundry.utils.setProperty(spellData, "system.type.value", prepared ? "standard" : "alwaysPrepared");

		foundry.utils.setProperty(spellData, "flags.black-flag.relationship.origin", origin);
		if (remote) foundry.utils.setProperty(spellData, "flags.core.sourceId", spell.uuid);
		return spellData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _updateObject(event, formData) {
		const spellData = this.slots.flatMap(slot =>
			Array.from(slot.selected ?? []).map(uuid => this._prepareSpellData(fromUuid(uuid), slot))
		);
		await this.document.createEmbeddedDocuments("Item", await Promise.all(spellData), { retainRelationship: true });
		await this.document.setFlag("black-flag", "spellsLearned", {
			learned: true,
			maxRing: this.document.system.spellcasting.maxRing
		});
	}
}
