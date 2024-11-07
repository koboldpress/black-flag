import { linkForUUID } from "../../utils/_module.mjs";

/**
 * Journal entry page the displays a list of spells.
 */
export default class JournalSpellListPageSheet extends JournalPageSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		const options = foundry.utils.mergeObject(super.defaultOptions, {
			dragDrop: [{ dropSelector: "form" }],
			scrollY: [".right.spell-list"],
			submitOnChange: true,
			width: 700,
			grouping: null
		});
		options.classes.push("spell-list");
		return options;
	}

	/* -------------------------------------------- */

	/**
	 * Currently selected grouping mode.
	 * @type {string|null}
	 */
	grouping = null;

	/* -------------------------------------------- */

	/** @inheritDoc */
	get template() {
		return `systems/black-flag/templates/journal/spell-list-page-${this.isEditable ? "edit" : "view"}.hbs`;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async getData(options) {
		const context = super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.fields = this.document.system.schema.fields;
		context.system = context.document.system;

		context.title = Object.fromEntries(Array.fromRange(4, 1).map(n => [`level${n}`, context.data.title.level + n - 1]));

		context.enriched = {};
		for (const key of ["conclusion", "introduction"]) {
			context.enriched[key] = await TextEditor.enrichHTML(context.system.description[key], { relativeTo: this });
			if (context.enriched[key] === "<p></p>") context.enriched[key] = "";
		}

		context.groupingOptions = Object.entries(this.document.system.constructor.GROUPING_MODES).map(([value, label]) => ({
			value,
			label: game.i18n.localize(label)
		}));
		context.grouping = this.grouping || this.options.grouping || context.system.grouping;

		context.spells = await this.prepareSpells(context.grouping);

		context.sections = {};
		const spellCircles = context.CONFIG.spellCircles();
		for (const data of context.spells) {
			const spell = data.spell ?? data.unlinked;
			let section;
			switch (context.grouping) {
				case "alphabetical":
					const letter = spell.name.slice(0, 1).toLowerCase();
					section = context.sections[letter] ??= { header: letter.toUpperCase(), spells: [] };
					break;
				case "circle":
					const circle = spell.system.circle.base;
					section = context.sections[circle] ??= { header: spellCircles[circle], spells: [] };
					break;
				case "school":
					const school = spell.system.school;
					section = context.sections[school] ??= { header: context.CONFIG.spellSchools.localized[school], spells: [] };
					break;
				default:
					continue;
			}
			section.spells.push(data);
		}
		context.sections = Object.values(context.sections);
		if (context.grouping === "school") {
			context.sections = context.sections.sort((lhs, rhs) => lhs.header.localeCompare(rhs.header, game.i18n.lang));
		}

		return context;
	}

	/* -------------------------------------------- */

	/**
	 * Load indices with necessary information for spells.
	 * @param {string} grouping - Grouping mode to respect.
	 * @returns {object[]}
	 */
	async prepareSpells(grouping) {
		const fields = ["system.circle.base", "system.description.short", "system.school"];
		const uuids = new Set(this.document.system.spells);

		let collections = new Collection();
		for (const uuid of uuids) {
			const { collection } = foundry.utils.parseUuid(uuid);
			if (collection && !collections.has(collection)) {
				if (collection instanceof Items) collections.set(collection, collection);
				else collections.set(collection, collection.getIndex({ fields }));
			} else if (!collection) uuids.delete(uuid);
		}

		const spells = (await Promise.all(collections.values())).flatMap(c => c.filter(s => uuids.has(s.uuid)));

		return spells
			.map(spell => {
				const data = {
					anchor: linkForUUID(spell.uuid, {
						tooltip: '<section class="loading"><i class="fas fa-spinner fa-spin-pulse"></i></section>'
					}),
					name: spell.name,
					school: CONFIG.BlackFlag.spellSchools.localized[spell.system.school],
					spell
				};
				return data;
			})
			.sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
	}

	/* -------------------------------------------- */
	/*  Event Handlers                              */
	/* -------------------------------------------- */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const [html] = jQuery;

		html.querySelector('[name="grouping"]')?.addEventListener("change", event => {
			this.grouping = event.target.value === this.document.system.grouping ? null : event.target.value;
			this.object.parent.sheet.render();
		});
		html.querySelectorAll("[data-action]").forEach(e => {
			e.addEventListener("click", this._onAction.bind(this));
		});
	}

	/* -------------------------------------------- */

	/**
	 * Handle performing an action.
	 * @param {PointerEvent} event - This triggering click event.
	 */
	async _onAction(event) {
		event.preventDefault();
		const { action } = event.target.dataset;

		const { itemUuid } = event.target.closest(".item")?.dataset ?? {};
		switch (action) {
			case "delete":
				if (itemUuid) {
					const spellSet = this.document.system.spells.filter(s => s !== itemUuid);
					await this.document.update({ "system.spells": Array.from(spellSet) });
				}
				this.render();
				break;
		}
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		let spells;
		switch (data?.type) {
			case "Folder":
				spells = (await Folder.implementation.fromDropData(data))?.contents;
				break;
			case "Item":
				spells = [await Item.implementation.fromDropData(data)];
				break;
			default:
				return false;
		}

		const spellUuids = this.document.system.spells;
		spells = spells.filter(item => item.type === "spell" && !spellUuids.has(item.uuid));
		if (!spells.length) return false;

		spells.forEach(i => spellUuids.add(i.uuid));
		await this.document.update({ "system.spells": Array.from(spellUuids) });
		this.render();
	}
}
