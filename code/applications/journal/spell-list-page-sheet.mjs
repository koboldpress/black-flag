import { linkForUUID } from "../../utils/_module.mjs";
import JournalEditor from "./journal-editor.mjs";

const { JournalEntryPageHandlebarsSheet } = foundry.applications.sheets.journal;

/**
 * Journal entry page the displays a list of spells.
 */
export default class JournalSpellListPageSheet extends JournalEntryPageHandlebarsSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			deleteItem: JournalSpellListPageSheet.#deleteItem,
			launchTextEditor: JournalSpellListPageSheet.#launchTextEditor
		},
		classes: ["black-flag", "spells"],
		grouping: null,
		position: {
			width: 750
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static EDIT_PARTS = {
		header: super.EDIT_PARTS.header,
		config: {
			template: "systems/black-flag/templates/journal/spell-list-page-config.hbs"
		},
		list: {
			classes: ["right", "spell-list"],
			template: "systems/black-flag/templates/journal/spell-list-page-list.hbs",
			scrollable: []
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static VIEW_PARTS = {
		content: {
			root: true,
			template: "systems/black-flag/templates/journal/spell-list-page-view.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Different ways in which spells can be grouped on the sheet.
	 * @type {Record<string, string>}
	 */
	static get GROUPING_MODES() {
		return BlackFlag.data.journal.SpellListJournalPageData.GROUPING_MODES;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Currently selected grouping mode.
	 * @type {string|null}
	 */
	grouping = null;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.system = this.document.system;

		context.title = {
			...context.title,
			...Object.fromEntries(
				Array.fromRange(4, 1).map(n => [`level${n}`, context.system.headingLevel || context.title.level + n - 1])
			)
		};

		context.headingLevelOptions = [
			{ value: "", label: _loc("BF.JournalPage.Class.HeadingLevel.Inherit"), rule: true },
			...Array.fromRange(6, 1).map(level => ({
				value: level,
				label: _loc("JOURNALENTRYPAGE.Level", { level })
			}))
		];

		context.enriched = {};
		for (const key of ["conclusion", "introduction"]) {
			context.enriched[key] = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
				context.system.description[key],
				{ relativeTo: this }
			);
			if (context.enriched[key] === "<p></p>") context.enriched[key] = "";
		}

		context.groupingOptions = Object.entries(this.constructor.GROUPING_MODES).map(([value, label]) => ({
			value,
			label: _loc(label)
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

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Load indices with necessary information for spells.
	 * @param {string} grouping - Grouping mode to respect.
	 * @returns {object[]}
	 */
	async prepareSpells(grouping) {
		const fields = ["system.circle.base", "system.description.short", "system.school"];
		const uuids = new Set(this.document.system.spells);

		let collections = new Collection();
		const remappedUuids = new Set();
		for (const baseUuid of uuids) {
			const { collection, uuid } = foundry.utils.parseUuid(baseUuid);
			remappedUuids.add(uuid);
			if (collection && !collections.has(collection)) {
				if (collection instanceof foundry.documents.collections.Items) collections.set(collection, collection);
				else collections.set(collection, collection.getIndex({ fields }));
			}
		}

		const spells = (await Promise.all(collections.values())).flatMap(c => c.filter(s => remappedUuids.has(s.uuid)));

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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Life-Cycle Handlers         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);
		if (this.isView) return;
		const left = document.createElement("div");
		left.classList.add("left", "flexcol", "standard-form");
		this.element.querySelector(".window-content").insertAdjacentElement("afterbegin", left);
		left.append(...this.element.querySelectorAll('[data-application-part="config"], [data-application-part="header"]'));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onRender(context, options) {
		await super._onRender(context, options);
		new CONFIG.ux.DragDrop({
			permissions: { drop: this._canDragDrop.bind(this) },
			callbacks: { drop: this._onDrop.bind(this) }
		}).bind(this.element);
		if (this.isView) {
			this.element.querySelector('[name="grouping"]')?.addEventListener("change", this._onChangeGroup.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle deleting a spell.
	 * @this {JournalSpellListPageSheet}
	 * @param {PointerEvent} event - The originating event.
	 * @param {HTMLElement} target - The action target.
	 */
	static #deleteItem(event, target) {
		const { itemUuid } = target.closest(".item")?.dataset ?? {};
		if (itemUuid) {
			const spellSet = this.document.system.spells.filter(s => s !== itemUuid);
			this.document.update({ "system.spells": Array.from(spellSet) });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle launching the individual text editing window.
	 * @this {JournalSpellListPageSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #launchTextEditor(event, target) {
		const textKeyPath = target.dataset.target;
		const label = event.target.closest(".form-group").querySelector("label");
		const editor = new JournalEditor({ document: this.document, textKeyPath, window: { title: label?.innerText } });
		editor.render({ force: true });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle changing the grouping.
	 * @param {Event} event - The triggering event.
	 * @protected
	 */
	_onChangeGroup(event) {
		this.grouping = event.target.value === this.document.system.grouping ? null : event.target.value;
		this.document.parent.sheet.render();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_canDragDrop() {
		return this.isEditable;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDrop(event) {
		const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
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
