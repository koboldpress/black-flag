import { filter, Search } from "../../utils/_module.mjs";

/**
 * Application for learning new spells.
 */
export default class SpellcastingDialog extends FormApplication {
	constructor(advancement, levels, options = {}) {
		super(options);

		this.advancement = advancement;
		this.levels = levels;
		this.existingSpells = this.advancement._getExistingSpells();

		this.slots = [];
		const level = this.advancement.relavantLevel(levels);
		const stats = this.advancement.statsForLevel(levels);

		const spellsBySlot = {};
		const replacedSpells = new Set(this.advancement.value.replaced?.[level]?.map(s => s.replacement?.id));
		for (const spell of this.advancement._getAddedSpells(this.levels)) {
			const slot = replacedSpells.has(spell.document?.id) ? "replacement" : spell.slot;
			spellsBySlot[slot] ??= [];
			spellsBySlot[slot].push(spell.uuid);
			this.existingSpells.delete(spell.uuid);
		}

		for (const [type, data] of stats) {
			// TODO: Handle replacements
			if (type === "replacement") continue;
			this.slots.push(...Array.fromRange(data.total).map((s, i) => ({ type, selected: spellsBySlot[type]?.shift() })));
		}

		// Begin fetching spells to display
		this.allSpells = Search.compendiums(Item, {
			type: "spell",
			indexFields: new Set(["system.source", "system.school", "system.circle.base", "system.tags"])
		}).then(spells =>
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
			template: "systems/black-flag/templates/advancement/spellcasting-dialog.hbs",
			resizable: true,
			scrollY: ["section.slots", "section.spells"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mapping of slot types to labels.
	 * @enum {string}
	 */
	static TYPE_LABELS = {
		cantrips: "BF.Spell.Circle.Cantrip[one]",
		rituals: "BF.Spell.Tag.Ritual.Label",
		special: "BF.Item.Type.Spell[one]",
		spells: "BF.Item.Type.Spell[one]",
		"spellbook:free": "BF.Spellbook.FreeSpell.Label[one]"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor for which the spells will be added.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.advancement.actor;
	}

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
	 * Level at which spells are being selected.
	 * @type {AdvancementLevels}
	 */
	levels;

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
	 * @property {string} type - Type of spell that can be added to the slot.
	 * @property {string} selected - UUID for selected spell.
	 * @property {string} [name] - Name to display for this slot.
	 */

	/**
	 * List of slots that need to be filled with spells.
	 * @type {SpellSlotData[]}
	 */
	slots;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The spellcasting configuration.
	 * @type {SpellcastingConfigurationData}
	 */
	get spellcasting() {
		return this.advancement.configuration;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
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
			if (slot.selected) otherSelected.add(slot.selected);
			return {
				...slot,
				name: slot.name ?? this.constructor.TYPE_LABELS[slot.type],
				number: index + 1,
				selected: index === this.selectedSlot,
				spell: slot.selected ? fromUuidSync(slot.selected) : null
			};
		});

		context.spells = (await this.allSpells).filter(
			s => !this.existingSpells.has(s.uuid) && filters && filter.performCheck(s, filters)
		);
		context.spells = context.spells.map(spell => ({
			...spell,
			disabled: this.currentSlot?.selected !== spell.uuid && otherSelected.has(spell.uuid),
			selected: this.currentSlot?.selected === spell.uuid
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
		const schools = this.spellcasting.spells.schools;
		const maxCircle = this.advancement.computeMaxCircle(this.advancement.relavantLevel(this.levels));

		// Always restrict by source unless current slot is special and there are no schools set
		// or the slot is ritual and ritual source isn't restricted
		if (
			!(
				(this.currentSlot.type === "special" && !schools.size) ||
				(this.currentSlot.type === "rituals" && !this.advancement.configuration.rituals.restricted)
			)
		) {
			filters.push({ k: "system.source", o: "has", v: this.spellcasting.source });
		}

		switch (this.currentSlot.type) {
			case "cantrips":
				// Cantrips are always circle 0
				filters.push({ k: "system.circle.base", v: 0 });
				break;
			case "rituals":
				filters.push(
					// Circle must be less than maximum
					{ k: "system.circle.base", o: "lte", v: maxCircle },
					// Must be a ritual spell
					{ k: "system.tags", o: "has", v: "ritual" }
				);
				break;
			case "spells":
				// Add restriction on school if they are set
				if (schools.size) filters.push({ k: "system.school", o: "in", v: schools });
			case "special":
			case "spellbook:free":
			case "spellbook:paid":
				filters.push(
					// No cantrips
					{ k: "system.circle.base", o: "gte", v: 1 },
					// Circle must be less than maximum
					{ k: "system.circle.base", o: "lte", v: maxCircle },
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

		const circle = filters.find(f => f.k === "system.circle.base" && !f.o);
		const maxCircle = filters.find(f => f.k === "system.circle.base" && f.o === "lte");
		if (circle?.v) restrictions.circle = CONFIG.BlackFlag.spellCircles()[circle.v];
		else if (maxCircle) restrictions.maxCircle = CONFIG.BlackFlag.spellCircles()[maxCircle.v];

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
		html.querySelectorAll("[data-spell-uuid]").forEach(element => {
			element.dataset.tooltip = `<section class="loading" data-uuid="${element.dataset.spellUuid}"></section>`;
			element.dataset.tooltipClass = "black-flag black-flag-tooltip item-tooltip";
			element.dataset.tooltipDirection = "LEFT";
		});
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
		} while (this.slots[nextIndex]?.selected && nextIndex !== this.selectedSlot);
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
				this.currentSlot.selected = event.target.value;
				return this.render();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _updateObject(event, formData) {
		const toAdd = new Map();
		const toRemove = new Set();
		const visibleSlots = new Set();

		for (const slot of this.slots) {
			visibleSlots.add(slot.type);
			if (!slot.selected) continue;
			toAdd.set(slot.selected, slot.type);
			// TODO: Handle replacement properly
		}

		for (const spell of this.advancement._getAddedSpells(this.levels)) {
			if (!visibleSlots.has(spell.slot)) continue;
			if (toAdd.get(spell.uuid) !== spell.slot) toRemove.add(spell.document);
			else toAdd.delete(spell.uuid);
		}

		if (toRemove.size) await this.advancement.reverse(this.levels, { deleteIds: toRemove });

		if (toAdd.size)
			await this.advancement.apply(this.levels, {
				added: Array.from(toAdd.entries()).map(([uuid, slot]) => ({ uuid, slot }))
			});
	}
}
