import { filter, search } from "../../utils/_module.mjs";

/**
 * Application for learning new spells.
 */
export default class SpellManager extends DocumentSheet {
	constructor(...args) {
		super(...args);
		this.slots = [];

		// Iterate over each spellcasting source, calculating cantrips, rituals, & spells known
		for ( const source of Object.values(this.document.system.spellcasting.sources) ) {
			for ( const type of ["cantrips", "rituals", "spells", "spellbook"] ) {
				if ( !source[type] ) continue;
				const diff = Math.max(source[type].max - source[type].value, 0);
				this.slots.push(...Array.fromRange(diff).map(s => ({
					type,
					mode: "single",
					source: source.document,
					selected: new Set()
				})));
			}
		}

		// Group slots by type
		this.slots.sort((lhs, rhs) => lhs.type.localeCompare(rhs.type, "en"));

		// Begin fetching spells to display
		this.allSpells = search.compendiums(Item, {
			type: "spell", indexFields: new Set(["system.circle", "system.school", "system.ring.base", "system.tags"])
		}).then(spells => spells.reduce((map, spell) => {
			map.set(spell.uuid, spell);
			return map;
		}, new Collection()));

		// TODO: Figure out what spells are already on sheet
		this.existingSpells = new Set();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "spell-manager"],
			width: 550,
			height: 650,
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
	 * @property {cantrips|rituals|spells|spellbook} type - Type of spell that can be added to the slot.
	 * @property {single|all} mode - Whether only one spell or multiple can be selected.
	 * @property {BlackFlagItem} source - Document with the spellcasting class that granted this slot.
	 * @property {Set<string>} selected - Set of UUIDs for selected spells, only one allowed in "single" mode.
	 */

	/**
	 * List of slots that need to be filled with spells.
	 * @type {SpellSlotData[]}
	 */
	slots;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options={}) {
		const context = await super.getData(options);

		const otherSelected = new Set();
		context.slots = this.slots.map((slot, index) => {
			slot.selected.map(s => otherSelected.add(s));
			return {
				...slot,
				name: this.constructor.TYPE_LABELS[slot.type],
				number: index + 1,
				selected: index === this.selectedSlot,
				spell: slot.mode === "single" ? fromUuidSync(slot.selected.first()) : null
			};
		});

		context.spells = (await this.allSpells)
			.filter(this.shouldDisplay.bind(this))
			.map(spell => ({
				...spell,
				disabled: !this.currentSlot.selected.has(spell.uuid) && otherSelected.has(spell.uuid),
				selected: this.currentSlot.selected.has(spell.uuid)
			}));

		context.completed = this.slots.every(s => s.selected.size);
		context.nextDisabled = !this.currentSlot.selected.size;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine if the provided spell should be displayed for the current slot.
	 * @param {object} spell - Index containing the spell's data.
	 * @returns {boolean}
	 */
	shouldDisplay(spell) {
		if ( this.existingSpells.has(spell.uuid) ) return false;
		const filters = []; // TODO: Fetch filters from the SpellcastingAdvancement
		switch ( this.currentSlot.type ) {
			case "cantrips":
				filters.push({ k: "system.ring.base", v: 0 });
				break;
			case "rituals":
				filters.push({ k: "system.tags", o: "has", v: "ritual" });
				break;
			case "spells":
			case "spellbook":
				filters.push(
					{ k: "system.ring.base", o: "gte", v: 1 },
					{ k: "system.ring.base", o: "lte", v: this.document.system.spellcasting.maxRing },
					{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
				);
				break;
		}
		return filter.performCheck(spell, filters);
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
			if ( nextIndex > this.slots.length - 1 ) nextIndex = 0;
		} while ( this.slots[nextIndex]?.selected.size && (nextIndex !== this.selectedSlot) );
		this.selectedSlot = nextIndex;
		this.render();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeInput(event) {
		super._onChangeInput(event);

		switch ( event.target.name ) {
			case "selected-slot":
				this.selectedSlot = Number(event.target.value);
				return this.render();
			case "selected-spell":
				this.currentSlot.selected = new Set([event.target.value]);
				return this.render();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_updateObject(event, formData) {
		console.log(event, formData);
	}
}
