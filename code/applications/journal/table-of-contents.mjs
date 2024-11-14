/**
 * Compendium that renders pages as a table of contents.
 */
export default class TableOfContentsCompendium extends Compendium {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["table-of-contents"],
			template: "systems/black-flag/templates/journal/table-of-contents.hbs",
			width: 800,
			height: 950,
			resizable: true,
			contextMenuSelector: "[data-entry-id]",
			dragDrop: [{ dragSelector: "[data-document-id]", dropSelector: "article" }]
		});
	}

	/* -------------------------------------------- */

	/**
	 * Position of pages based on type.
	 * @enum {number}
	 */
	static TYPES = {
		chapter: 0,
		appendix: 100
	};

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		const documents = await this.collection.getDocuments();

		context.chapters = [];
		const specialEntries = [];
		for (const entry of documents) {
			const flags = entry.flags?.[game.system.id];
			if (!flags) continue;
			const type = flags.type ?? "chapter";

			if (type === "header") {
				const page = entry.pages.contents[0];
				context.header = {
					title: flags.title ?? page?.name,
					content: page?.text.content
				};
				continue;
			}

			const data = {
				type,
				flags,
				id: entry.id,
				name: flags.title ?? entry.name,
				pages: Array.from(entry.pages).map(({ flags, id, name, sort, title }) => ({
					id,
					sort,
					flags,
					level: title.level,
					name: flags[game.system.id]?.title ?? name,
					entryId: entry.id
				}))
			};

			if (type === "special") {
				data.showPages = flags.showPages ?? !flags.append;
				specialEntries.push(data);
			} else {
				data.order = (this.constructor.TYPES[type] ?? 200) + (flags.position ?? 0);
				data.showPages = flags.showPages !== false && (flags.showPages === true || type === "chapter");
				context.chapters.push(data);
			}
		}

		context.chapters.sort((lhs, rhs) => lhs.order - rhs.order);
		for (const entry of specialEntries) {
			const append = entry.flags.append;
			const order = entry.flags.order;
			if (append) {
				context.chapters[append - 1].pages.push({ ...entry, sort: order, entry: true });
			} else {
				context.chapters.push(entry);
			}
		}

		const handlePages = (chapter, _d = 0) => {
			for (const chapter of context.chapters) {
				chapter.pages.sort((lhs, rhs) => lhs.sort - rhs.sort);
				for (const page of chapter.pages) {
					const classes = [`level-${page.level}`];
					if (page.showPages && page.pages?.length) {
						classes.push("child-pages");
						if (_d < 2) handlePages(page, _d + 1);
					}
					if (page.entry) classes.push("special-entry");
					page.classes = classes.join(" ");
				}
			}
		};
		context.chapters.forEach(c => handlePages(c));

		return context;
	}

	/* -------------------------------------------- */
	/*  Event Handlers                              */
	/* -------------------------------------------- */

	/** @inheritDoc */
	activateListeners(html) {
		super.activateListeners(html);
		html.find("a").on("click", this._onClickLink.bind(this));
	}

	/* -------------------------------------------- */

	/**
	 * Handle clicking a link to a journal entry or page.
	 * @param {PointerEvent} event - The triggering click event.
	 * @protected
	 */
	async _onClickLink(event) {
		const entryId = event.currentTarget.closest("[data-entry-id]")?.dataset.entryId;
		if (!entryId) return;
		const entry = await this.collection.getDocument(entryId);
		entry?.sheet.render(true, {
			pageId: event.currentTarget.closest("[data-page-id]")?.dataset.pageId
		});
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	_onDragStart(event) {
		let dragData;
		if (ui.context) ui.context.close({ animate: false });
		dragData = this._getEntryDragData(event.target.dataset.documentId);
		if (!dragData) return;
		event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
	}
}
