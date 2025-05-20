import Proficiency from "../../documents/proficiency.mjs";
import { linkForUUID, log, numberFormat, Trait } from "../../utils/_module.mjs";
import JournalEditor from "./journal-editor.mjs";

/**
 * Journal entry page that displays an automatically generated summary of a class along with additional description.
 */
export default class ClassPageSheet extends foundry.appv1.sheets.JournalPageSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		const options = foundry.utils.mergeObject(super.defaultOptions, {
			dragDrop: [{ dropSelector: ".drop-target" }],
			height: "auto",
			width: 500,
			submitOnChange: true
		});
		options.classes.push("class-editor");
		return options;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get template() {
		return `systems/black-flag/templates/journal/${this.type}-page-${this.isEditable ? "edit" : "view"}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Whether this page represents a class or subclass.
	 * @type {string}
	 */
	get type() {
		return this.document.system.metadata.type;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	toc = {};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options = {}) {
		const context = await super.getData(options);
		context.system = context.document.system;

		context.title = Object.fromEntries(
			Array.fromRange(4, 1).map(n => [
				`level${n}`,
				(context.data.system.headingLevel || context.data.title.level) + n - 1
			])
		);

		context.internalHeadingLevels = {
			...context.headingLevels,
			4: game.i18n.format("JOURNALENTRYPAGE.Level", { level: 4 })
		};

		const linked = await fromUuid(this.document.system.item);
		const subclasses =
			this.type === "class" ? await Promise.all(this.document.system.subclasses.map(s => fromUuid(s))) : [];

		if (!linked) return context;
		context.linked = {
			document: linked,
			name: linked.name,
			lowercaseName: linked.name.toLowerCase()
		};

		const features = await this._prefetchFeatures([linked, ...subclasses]);

		context.advancement = this._getAdvancement(linked);
		context.enriched = await this._getDescriptions(context.document);
		context.table = await this._getTable(linked, { features });
		context.features = await this._getFeatures(linked, { features });
		if (subclasses.length)
			context.subclasses = (await this._getSubclasses(subclasses, { features })).sort((lhs, rhs) =>
				lhs.name.localeCompare(rhs.name)
			);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-fetch all features associated with the provided items through grant & choose features advancements.
	 * @param {BlackFlagItem[]} items - Items from which the features should be fetched.
	 * @param {boolean} [subfeatures=true] - Should the fetching process repeat for found features?
	 * @returns {Collection<string, BlackFlagItem>} - Mapping of UUIDs to feature items.
	 * @internal
	 */
	async _prefetchFeatures(items, subfeatures = true) {
		const uuidsToFetch = items
			.filter(i => i)
			.map(i => {
				const advancements = i.system.advancement
					?.byType("grantFeatures")
					.concat(i.system.advancement?.byType("chooseFeatures"))
					.filter(a => !a.getFlag(game.system.id, "hideOnClassTable"));
				return advancements.flatMap(a => a.configuration.pool.map(p => p.uuid));
			})
			.flat();

		const fetched = new Collection(await Promise.all(uuidsToFetch.map(async uuid => [uuid, await fromUuid(uuid)])));

		if (subfeatures) (await this._prefetchFeatures(fetched, false)).forEach(f => fetched.set(f.uuid, f));

		return fetched;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare features granted by various advancement types.
	 * @param {BlackFlagItem} item - Class item belonging to this journal.
	 * @returns {object} - Prepared advancement section.
	 * @internal
	 */
	_getAdvancement(item) {
		const advancement = {};

		const hp = item.system.advancement.byType("hitPoints")[0];
		if (hp) {
			advancement.hp = {
				hitDice: `1d${hp.configuration.denomination}`,
				max: hp.configuration.denomination,
				average: hp.average
			};
		}

		const traits = item.system.advancement.byType("trait");
		const makeTrait = type => {
			const advancement = traits.find(a => a.bestGuessTrait() === type);
			// TODO: Probably need to filter this by `level = 1` && `classRestriction !== "multiclass"`
			if (!advancement) return game.i18n.localize("BF.Proficiency.None");
			return Trait.localizedList(advancement.configuration.grants, advancement.configuration.choices, {
				choiceMode: advancement.configuration.choiceMode
			});
		};
		advancement.traits = {
			armor: makeTrait("armor"),
			weapons: makeTrait("weapons"),
			tools: makeTrait("tools"),
			saves: makeTrait("saves"),
			skills: makeTrait("skills")
		};

		const equipment = item.system.advancement.byType("equipment")[0];
		if (equipment) advancement.equipment = equipment.summaryForLevel();

		return advancement;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Enrich all of the entries within the descriptions object on the sheet's system data.
	 * @param {JournalEntryPage} page - Journal page being enriched.
	 * @returns {Promise<object>} - Object with enriched descriptions.
	 * @internal
	 */
	async _getDescriptions(page) {
		return Object.fromEntries(
			await Promise.all(
				Object.entries(page.system.description ?? {}).map(async ([id, text]) => {
					const enriched = await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(text, {
						relativeTo: this.object,
						secrets: this.object.isOwner,
						async: true
					});
					return [id, enriched];
				})
			)
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare table based on Grant Features advancement & Scale Value advancement.
	 * @param {BlackFlagItem} item - Class item belonging to this journal.
	 * @param {object} options
	 * @param {Collection<BlackFlagItem>} options.features - Pre-fetched feature items.
	 * @param {number} [options.initialLevel=1] - Level at which the table begins.
	 * @returns {object} - Prepared table data.
	 * @internal
	 */
	async _getTable(item, { features, initialLevel = 1 }) {
		const hasFeatures = !!item.system.advancement.byType("grantFeatures");
		const scaleValues = this._getScaleValues(item, { features });
		const spellProgression = await item.system.advancement.byType("spellcasting")[0]?.generateSpellcastingTable();

		const headers = [[{ content: game.i18n.localize("BF.Level.Label[one]") }]];
		if (item.type === "class") headers[0].push({ content: game.i18n.localize("BF.Proficiency.Bonus.Abbreviation") });
		if (hasFeatures) headers[0].push({ content: game.i18n.localize("BF.Item.Type.Feature[other]") });
		headers[0].push(...scaleValues.column.map(a => ({ content: a.title })));
		if (spellProgression) {
			if (spellProgression.headers.length > 1) {
				headers[0].forEach(h => (h.rowSpan = 2));
				headers[0].push(...spellProgression.headers[0]);
				headers[1] = spellProgression.headers[1];
			} else {
				headers[0].push(...spellProgression.headers[0]);
			}
		}

		const cols = [{ class: "level", span: 1 }];
		if (item.type === "class") cols.push({ class: "prof", span: 1 });
		if (hasFeatures) cols.push({ class: "features", span: 1 });
		if (scaleValues.column.length) cols.push({ class: "scale", span: scaleValues.column.length });
		if (spellProgression) cols.push(...spellProgression.cols);

		const featuresInTable = new Set();

		const rows = [];
		for (const level of Array.fromRange(CONFIG.BlackFlag.maxLevel - initialLevel + 1, initialLevel)) {
			const features = {};

			for (const advancement of item.system.advancement.byLevel(level)) {
				if (advancement.getFlag(game.system.id, "hideOnClassTable")) continue;
				switch (advancement.constructor.typeName) {
					case "grantFeatures":
						advancement.configuration.pool.forEach(d => (features[d.uuid] = linkForUUID(d.uuid, { element: true })));
						break;
					case "expandedTalentList":
					case "improvement":
						features[advancement.uuid] = advancement.titleForLevel({ character: level, class: level });
						break;
				}
			}
			Object.keys(features).forEach(uuid => featuresInTable.add(uuid));

			for (const uuid of featuresInTable) {
				const scales = scaleValues.grouped.get(uuid)?.filter(s => s.configuration.scale[level]);
				if (!scales?.length) continue;
				const values = scales.map(s => s.valueForLevel(level).display);
				features[uuid] ??= linkForUUID(uuid, { element: true });
				features[uuid].innerHTML += ` (${game.i18n.getListFormatter({ type: "unit" }).format(values)})`;
			}

			if (item.type === "class" && level === CONFIG.BlackFlag.subclassLevel) {
				features.subclass = game.i18n.format("BF.Subclass.LabelSpecific", { class: item.name });
			} else if (item.type === "class" && CONFIG.BlackFlag.subclassFeatureLevels.includes(level)) {
				features.subclass = game.i18n.localize("BF.Feature.Category.Subclass[one]");
			}

			// Level & proficiency bonus
			const cells = [{ class: "level", content: numberFormat(level, { ordinal: true }) }];
			if (item.type === "class") cells.push({ class: "prof", content: `+${Proficiency.calculateMod(level)}` });
			if (hasFeatures)
				cells.push({
					class: "features",
					content: Object.values(features)
						.map(f => (foundry.utils.getType(f) === "string" ? f : f.outerHTML))
						.join(", ")
				});
			scaleValues.column.forEach(s => cells.push({ class: "scale", content: s.valueForLevel(level)?.display ?? "—" }));
			const spellCells = spellProgression?.rows[level - 1];
			if (spellCells) cells.push(...spellCells);

			// Skip empty rows on subclasses
			const hasContent = !foundry.utils.isEmpty(features) || scaleValues.length || spellCells;
			if (item.type !== "subclass" || (level >= CONFIG.BlackFlag.subclassLevel && hasContent)) {
				rows.push(cells);
			}
		}

		return { headers, cols, rows };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort scale values into ones displayed in their own column versus ones grouped with features.
	 * @param {BlackFlagItem} item - Class or subclass item being prepared.
	 * @param {object} options
	 * @param {Collection<BlackFlagItem>} options.features - Pre-fetched feature items.
	 * @returns {{column: ScaleValueAdvancement[], grouped: Collection<ScaleValueAdvancement[]>}}
	 */
	_getScaleValues(item, { features }) {
		const filter = a => a.filter(a => !a.getFlag(game.system.id, "hideOnClassTable"));
		return {
			column: filter(item.system.advancement.byType("scaleValue")),
			grouped: features.reduce((collection, feature) => {
				collection.set(feature.uuid, filter(feature.system.advancement.byType("scaleValue")));
				return collection;
			}, new Collection())
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch data for each class feature listed.
	 * @param {BlackFlagItem} item - Class or subclass item belonging to this journal.
	 * @param {object} options
	 * @param {Collection<BlackFlagItem>} options.features - Pre-fetched feature items.
	 * @returns {object[]}   Prepared features.
	 */
	async _getFeatures(item, { features }) {
		const makeTag = levels => {
			if (foundry.utils.getType(levels) !== "Array") levels = [levels];
			return game.i18n.format("BF.Feature.Tag", {
				level: game.i18n
					.getListFormatter()
					.format(levels.sort((lhs, rhs) => lhs - rhs).map(l => numberFormat(l, { ordinal: true }))),
				owner: item.name,
				type: game.i18n.localize("BF.Item.Type.Feature[one]")
			});
		};

		let prepared = [];
		for (const advancement of item.system.advancement.byType("grantFeatures")) {
			const level = advancement.level.value;
			prepared.push(
				...advancement.configuration.pool.map(async d => {
					const doc = features.get(d.uuid);
					if (!doc) return;
					const levels = doc.system.advancement?.levels ?? [];
					if (!levels.includes(level)) levels.unshift(level);
					return {
						level,
						document,
						name: doc.name,
						description: await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
							doc.system.description.value,
							{
								relativeTo: doc,
								secrets: false,
								async: true
							}
						),
						tag: makeTag(levels)
					};
				})
			);
		}

		if (item.system.advancement.byType("improvement").length) {
			const levels = item.system.advancement.byType("improvement").map(a => a.level.value);
			const first = item.system.advancement.byType("improvement")[0];
			prepared.push({
				level: first.level.value,
				name: first.titleForLevel(),
				document: first,
				description: first.journalSummary(),
				tag: makeTag(levels)
			});
		}

		if (item.type === "class")
			prepared.push({
				level: CONFIG.BlackFlag.subclassLevel,
				name: game.i18n.format("BF.Subclass.LabelSpecific", { class: item.name }),
				description: this.document.system.description.subclassAdvancement
					? await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
							this.document.system.description.subclassAdvancement,
							{
								relativeTo: item,
								secrets: false,
								async: true
							}
						)
					: game.i18n.localize("BF.JournalPage.Class.Subclass.AdvancementDescription.Placeholder"),
				tag: makeTag(CONFIG.BlackFlag.subclassFeatureLevels)
			});

		if (item.type === "subclass") {
			const advancement = item.system.advancement.byType("expandedTalentList")[0];
			if (advancement)
				prepared.push({
					level: CONFIG.BlackFlag.subclassLevel,
					name: advancement.titleForLevel(),
					document: advancement,
					description: await advancement.journalSummary(),
					tag: makeTag(CONFIG.BlackFlag.subclassLevel)
				});
		}

		return (await Promise.all(prepared)).sort((lhs, rhs) => lhs.level - rhs.level);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for any linked subclasses.
	 * @param {BlackFlagItem[]} subclasses - Subclasses to prepare.
	 * @param {object} options
	 * @param {Collection<BlackFlagItem>} options.features - Pre-fetched feature items.
	 * @returns {object[]} - Prepared subclasses.
	 */
	async _getSubclasses(subclasses, { features }) {
		return await Promise.all(
			subclasses
				.filter(s => s)
				.map(async document => {
					return {
						document,
						name: document.name,
						description: await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
							document.system.description.value,
							{
								relativeTo: document,
								secrets: false,
								async: true
							}
						),
						features: await this._getFeatures(document, { features }),
						table: await this._getTable(document, { features, initialLevel: CONFIG.BlackFlag.subclassLevel })
					};
				})
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _renderInner(...args) {
		const html = await super._renderInner(...args);
		this.toc = JournalEntryPage.buildTOC(html.get());
		return html;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll("[data-action]")) {
			element.addEventListener("click", this._onAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle an action.
	 * @param {Event} event - Triggering click event.
	 * @returns {Promise}
	 */
	async _onAction(event) {
		const { action, ...properties } = event.currentTarget.dataset;
		switch (action) {
			case "delete":
				const container = event.currentTarget.closest("[data-item-uuid]");
				const uuidToDelete = container?.dataset.itemUuid;
				if (!uuidToDelete) return;
				switch (container.dataset.itemType) {
					case "linked":
						await this.document.update({ "system.item": "" });
						return this.render();
					case "subclass":
						const subclassCollection = this.document.system.subclasses;
						subclassCollection.delete(uuidToDelete);
						await this.document.update({ "system.subclasses": Array.from(subclassCollection) });
						return this.render();
				}
				break;
			case "launch-text-editor":
				const label = event.target.closest("label");
				return new JournalEditor({
					document: this.document,
					textKeyPath: properties.target,
					window: {
						title: label?.querySelector("span")?.innerText
					}
				}).render({ force: true });
			default:
				return log(`Unrecognized action: ${action}`, { level: "warn" });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_canDragDrop() {
		return this.isEditable;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _onDrop(event) {
		const data = (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).getDragEventData(event);

		if (data?.type !== "Item") return false;
		const item = await Item.implementation.fromDropData(data);
		const type = this.type === item.type ? "linked" : item.type;
		switch (type) {
			case "linked":
				await this.document.update({ "system.item": item.uuid });
				return this.render();
			case "subclass":
				const subclassCollection = this.document.system.subclasses;
				subclassCollection.add(item.uuid);
				await this.document.update({ "system.subclasses": Array.from(subclassCollection) });
				return this.render();
			default:
				return false;
		}
	}
}
