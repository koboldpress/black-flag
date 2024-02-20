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
					type, source: source.document, mode: type === "spellbook" ? "free" : "limited"
				})));
			}
		}

		this.slots.sort((lhs, rhs) => lhs.type.localeCompare(rhs.type, "en"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "spell-manager"],
			width: 550,
			height: 650,
			template: "systems/black-flag/templates/actor/spell-manager.hbs",
			resizable: true,
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
	 * Index of the currently selected slot.
	 * @type {number}
	 */
	selectedSlot = 0;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of slots that need to be filled with spells.
	 * @type {object[]}
	 */
	slots;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options={}) {
		const context = await super.getData(options);
		context.slots = this.slots.map((slot, index) => {
			slot = foundry.utils.deepClone(slot);
			slot.name = this.constructor.TYPE_LABELS[slot.type];
			slot.number = index + 1;
			slot.selected = index === this.selectedSlot;
			return slot;
		});
		return context;
	}
}
