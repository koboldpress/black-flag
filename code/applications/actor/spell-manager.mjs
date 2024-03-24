import { filter, numberFormat, search } from "../../utils/_module.mjs";

/**
 * Application for learning new spells.
 */
export default class SpellManager extends DocumentSheet {
	constructor(...args) {
		super(...args);
		this.slots = [];
		const circles = new Map();

		// Iterate over each spellcasting source, calculating cantrips, rituals, & spells known
		for ( const source of Object.values(this.document.system.spellcasting.sources) ) {
			for ( const type of ["cantrips", "rituals", "spells", "spellbook"] ) {
				if ( !source[type] ) continue;
				const diff = Math.max(source[type].max - source[type].value, 0);
				this.slots.push(...Array.fromRange(diff).map(s => ({
					type,
					mode: "single",
					source: source.document,
					spellcasting: source.spellcasting,
					selected: new Set()
				})));
			}
			if ( (source.spellcasting.spells.mode === "all") && !circles.has(source.spellcasting.circle) ) {
				circles.set(source.spellcasting.circle, source);
			}
		}

		// Prepare all learning slots
		const circleSlots = [];
		for ( const [circle, label] of Object.entries(CONFIG.BlackFlag.spellCircles.localized) ) {
			const source = circles.get(circle);
			if ( !source ) continue;
			for ( const ring of Array.fromRange(this.document.system.spellcasting.maxRing, 1) ) {
				circleSlots.push({
					name: game.i18n.getListFormatter({ type: "unit" }).format([label, numberFormat(ring, { ordinal: true })]),
					type: "circle",
					mode: "all",
					ring,
					source: source.document,
					spellcasting: source.spellcasting
				});
			}
		}

		// Group slots by type and then append typed slots
		this.slots.sort((lhs, rhs) => lhs.type.localeCompare(rhs.type, "en"));
		this.slots.push(...circleSlots);

		// Begin fetching spells to display
		this.allSpells = search.compendiums(Item, {
			type: "spell", indexFields: new Set(["system.circle", "system.school", "system.ring.base", "system.tags"])
		}).then(spells => spells.reduce((map, spell) => {
			map.set(spell.uuid, spell);
			return map;
		}, new Collection()));

		// Figure out what spells are already on sheet
		this.existingSpells = new Set();
		for ( const spell of this.document.items ) {
			if ( spell.type !== "spell" ) continue;
			if ( !["standard", "alwaysPrepared"].includes(spell.system.type.value) ) continue;
			const sourceId = foundry.utils.getProperty(spell, "flags.core.sourceId");
			this.existingSpells.add(sourceId);
		}
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
	 * @property {cantrips|circle|rituals|spells|spellbook} type - Type of spell that can be added to the slot.
	 * @property {single|all} mode - Whether only one spell or multiple can be selected.
	 * @property {BlackFlagItem} source - Document with the spellcasting class that granted this slot.
	 * @property {Set<string>} selected - Set of UUIDs for selected spells, only one allowed in "single" mode.
	 * @property {string} [name] - Name to display for this slot.
	 * @property {number} [ring] - Spell ring (only used for "circle" type).
	 */

	/**
	 * List of slots that need to be filled with spells.
	 * @type {SpellSlotData[]}
	 */
	slots;

	/* <><><><> <><><><> <><><><> <><><><> */

	get title() {
		return game.i18n.localize("BF.Spellbook.Title");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options={}) {
		const context = await super.getData(options);

		context.restrictions = {
			circle: CONFIG.BlackFlag.spellCircles.localized[this.currentSlot.spellcasting.circle]
		};

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

		context.spells = (await this.allSpells).filter(this.shouldDisplay.bind(this));
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
	 * Determine if the provided spell should be displayed for the current slot.
	 * @param {object} spell - Index containing the spell's data.
	 * @returns {boolean}
	 */
	shouldDisplay(spell) {
		if ( this.existingSpells.has(spell.uuid) || !this.currentSlot ) return false;
		const filters = [];

		// Fetch filters from the SpellcastingAdvancement
		filters.push({ k: "system.circle", o: "has", v: this.currentSlot.spellcasting.circle });

		switch ( this.currentSlot.type ) {
			case "cantrips":
				filters.push({ k: "system.ring.base", v: 0 });
				break;
			case "circle":
				filters.push(
					{ k: "system.ring.base", v: this.currentSlot.ring },
					{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
				);
				break;
			case "rituals":
				filters.push(
					{ k: "system.tags", o: "has", v: "ritual" },
					{ k: "system.ring.base", o: "lte", v: this.document.system.spellcasting.maxRing }
				);
				break;
			case "spells":
			case "spellbook":
				filters.push(
					{ k: "system.ring.base", o: "gte", v: 1 },
					{ k: "system.ring.base", o: "lte", v: this.document.system.spellcasting.maxRing },
					{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
				);
				break;
			default:
				return false;
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
		if ( event.target.name.startsWith("selected.") ) {
			const id = event.target.name.replace("selected.", "");
			if ( event.target.checked ) this.currentSlot.selected.add(id);
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
		const source = remote ? foundry.utils.getProperty(spellData, "flags.black-flag.relationship.source") ?? {} : {};

		source.identifiers ??= [];
		source.identifiers.push(slot.source.identifier);
		if ( slot.type === "spellbook" ) source.spellbookOrigin = "free";

		const prepared = foundry.utils.getProperty(spellData, "system.ring.base") > 0
			? CONFIG.BlackFlag.spellLearningModes[slot.spellcasting.spells.mode]?.prepared : true;
		foundry.utils.setProperty(spellData, "system.type.value", prepared ? "standard" : "alwaysPrepared");

		foundry.utils.setProperty(spellData, "flags.black-flag.relationship.source", source);
		if ( remote ) foundry.utils.setProperty(spellData, "flags.core.sourceId", spell.uuid);
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
			learned: true, maxRing: this.document.system.spellcasting.maxRing
		});
	}
}