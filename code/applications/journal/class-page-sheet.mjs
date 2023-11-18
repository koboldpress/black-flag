import SpellcastingTemplate from "../../data/actor/templates/spellcasting-template.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import { linkForUUID, log, Trait } from "../../utils/_module.mjs";
import JournalEditor from "./journal-editor.mjs";

/**
 * Journal entry page that displays an automatically generated summary of a class along with additional description.
 */
export default class ClassPageSheet extends JournalPageSheet {

	static get defaultOptions() {
		const options = foundry.utils.mergeObject(super.defaultOptions, {
			dragDrop: [{dropSelector: ".drop-target"}],
			height: "auto",
			width: 500,
			submitOnChange: true
		});
		options.classes.push("class-editor");
		return options;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get template() {
		return `systems/black-flag/templates/journal/class-page-${this.isEditable ? "edit" : "view"}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	toc = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options={}) {
		const context = await super.getData(options);
		context.system = context.document.system;

		context.title = Object.fromEntries(
			Array.fromRange(4, 1).map(n => [`level${n}`, context.data.title.level + n - 1])
		);

		const linked = await fromUuid(this.document.system.item);

		if ( !linked ) return context;
		context.linked = {
			document: linked,
			name: linked.name,
			lowercaseName: linked.name.toLowerCase()
		};

		context.advancement = this._getAdvancement(linked);
		context.enriched = await this._getDescriptions(context.document);
		context.table = await this._getTable(linked);
		context.features = await this._getFeatures(linked);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare features granted by various advancement types.
	 * @param {BlackFlagItem} item - Class item belonging to this journal.
	 * @returns {object} - Prepared advancement section.
	 */
	_getAdvancement(item) {
		const advancement = {};

		const hp = item.system.advancement.byType("hitPoints")[0];
		if ( hp ) {
			advancement.hp = {
				hitDice: `1d${hp.configuration.denomination}`,
				max: hp.configuration.denomination,
				average: hp.average
			};
		}

		const traits = item.system.advancement.byType("trait");
		const keyAbility = item.system.advancement.byType("keyAbility")[0];
		const makeTrait = type => {
			const advancement = traits.find(a => a.bestGuessTrait() === type);
			// TODO: Probably need to filter this by `level = 1` && `classRestriction !== "secondary"`
			if ( !advancement ) return game.i18n.localize("BF.Proficiency.None");
			return Trait.localizedList(
				advancement.configuration.grants,
				advancement.configuration.choices,
				{ choiceMode: advancement.configuration.choiceMode }
			);
		};
		advancement.traits = {
			armor: makeTrait("armor"),
			weapons: makeTrait("weapons"),
			tools: makeTrait("tools"),
			saves: keyAbility?.journalSummary() ?? game.i18n.localize("BF.Proficiency.None"),
			skills: makeTrait("skills")
		};

		return advancement;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Enrich all of the entries within the descriptions object on the sheet's system data.
	 * @param {JournalEntryPage} page - Journal page being enriched.
	 * @returns {Promise<object>} - Object with enriched descriptions.
	 */
	async _getDescriptions(page) {
		return Object.fromEntries(await Promise.all(Object.entries(page.system.description ?? {})
			.map(async ([id, text]) => {
				const enriched = await TextEditor.enrichHTML(text, {
					relativeTo: this.object,
					secrets: this.object.isOwner,
					async: true
				});
				return [id, enriched];
			})
		));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare table based on Grant Features advancement & Scale Value advancement.
	 * @param {BlackFlagItem} item - Class item belonging to this journal.
	 * @param {number} [initialLevel=1] - Level at which the table begins.
	 * @returns {object} - Prepared table data.
	 */
	async _getTable(item, initialLevel=1) {
		const hasFeatures = !!item.system.advancement.byType("grantFeatures");
		const scaleValues = this._getScaleValues(item);
		const spellProgression = await this._getSpellProgression(item);

		const headers = [[{content: game.i18n.localize("BF.Level.Label[one]")}]];
		if ( item.type === "class" ) headers[0].push({content: game.i18n.localize("BF.Proficiency.Bonus.Abbreviation")});
		if ( hasFeatures ) headers[0].push({content: game.i18n.localize("BF.Item.Type.Feature[other]")});
		headers[0].push(...scaleValues.column.map(a => ({content: a.title})));
		if ( spellProgression ) {
			if ( spellProgression.headers.length > 1 ) {
				headers[0].forEach(h => h.rowSpan = 2);
				headers[0].push(...spellProgression.headers[0]);
				headers[1] = spellProgression.headers[1];
			} else {
				headers[0].push(...spellProgression.headers[0]);
			}
		}

		const cols = [{ class: "level", span: 1 }];
		if ( item.type === "class" ) cols.push({class: "prof", span: 1});
		if ( hasFeatures ) cols.push({class: "features", span: 1});
		if ( scaleValues.column.length ) cols.push({class: "scale", span: scaleValues.column.length});
		if ( spellProgression ) cols.push(...spellProgression.cols);

		const rows = [];
		for ( const level of Array.fromRange((CONFIG.BlackFlag.maxLevel - initialLevel + 1), initialLevel) ) {
			const features = {};
			if ( level === CONFIG.BlackFlag.subclassLevel ) {
				features.subclass = game.i18n.format("BF.Subclass.LabelSpecific", { class: item.name });
			}

			for ( const advancement of item.system.advancement.byLevel(level) ) {
				switch ( advancement.constructor.typeName ) {
					case "grantFeatures":
						advancement.configuration.pool.forEach(d => features[d.uuid] = linkForUUID(d.uuid, { element: true }));
						break;
					case "improvement":
						features[advancement.uuid] = game.i18n.localize("BF.Advancement.Improvement.Title");
						break;
				}
			}

			for ( const scale of scaleValues.grouped ) {
				if ( !scale.configuration.scale[level] ) continue;
				const uuid = scale.configuration.item.uuid;
				features[uuid] ??= linkForUUID(uuid, { element: true });
				features[uuid].innerHTML += ` (${scale.valueForLevel(level).display})`;
			}

			// Level & proficiency bonus
			const cells = [{class: "level", content: level.ordinalString()}]; // TODO: Use proper ordinal localization
			if ( item.type === "class" ) cells.push({class: "prof", content: `+${Proficiency.calculateMod(level)}`});
			if ( hasFeatures ) cells.push({
				class: "features", content: Object.values(features).map(f =>
					foundry.utils.getType(f) === "string" ? f : f.outerHTML
				).join(", ")
			});
			scaleValues.column.forEach(s => cells.push({class: "scale", content: s.valueForLevel(level)?.display}));
			const spellCells = spellProgression?.rows[rows.length];
			if ( spellCells ) cells.push(...spellCells);

			rows.push(cells);
		}

		return { headers, cols, rows };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort scale values into ones displayed in their own column versus ones grouped with features.
	 * @param {Item5e} item - Class or subclass item being prepared.
	 * @returns {{grouped: ScaleValueAdvancement[], column: ScaleValueAdvancement[]}}
	 */
	_getScaleValues(item) {
		return item.system.advancement.byType("scaleValue").reduce(({ column, grouped }, scale) => {
			if ( fromUuidSync(scale.configuration.item.uuid) ) grouped.push(scale);
			else column.push(scale);
			return { column, grouped };
		}, { column: [], grouped: [] });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build out the spell progression data.
	 * @param {BlackFlagItem} item - Class item belonging to this journal.
	 * @returns {object} - Prepared spell progression table.
	 */
	async _getSpellProgression(item) {
		const spellcasting = item.system.spellcasting;
		if ( !spellcasting ) return null;

		const table = { rows: [] };

		if ( spellcasting.type === "leveled" ) {
			const spells = {};
			Array.fromRange(CONFIG.BlackFlag.maxSpellRing, 1).forEach(l => spells[`ring-${l}`] = {});

			let largestSlot;
			for ( const level of Array.fromRange(CONFIG.BlackFlag.maxLevel, 1).reverse() ) {
				const progression = { leveled: 0 };
				SpellcastingTemplate.computeClassProgression(progression, item, { levels: level, spellcasting });
				SpellcastingTemplate.prepareSpellcastingSlots(spells, "leveled", progression);

				if ( !largestSlot ) largestSlot = Object.values(spells).reduce((slot, data) =>
					data.max && (data.level > slot) ? data.level : slot
				, -1);

				table.rows.push(Array.fromRange(largestSlot, 1).map(ring => {
					return {class: "spell-slots", content: spells[`ring-${ring}`]?.max || "&mdash;"};
				}));
			}

			// Prepare headers & columns
			const rings = CONFIG.BlackFlag.spellRings();
			table.headers = [Array.fromRange(largestSlot, 1).map(ring => ({content: rings[ring]}))];
			table.cols = [{class: "spellcasting", span: largestSlot}];
			table.rows.reverse();
		}

		else {
			/**
			 * A hook event that fires to generate the table for custom spellcasting types.
			 * The actual hook names include the spellcasting type (e.g. `blackFlag.buildPsionicSpellcastingTable`).
			 * @param {object} table - Table definition being built. *Will be mutated.*
			 * @param {Item5e} item - Class for which the spellcasting table is being built.
			 * @param {SpellcastingConfigurationData} spellcasting - Spellcasting configuration.
			 * @function blackFlag.buildSpellcastingTable
			 * @memberof hookEvents
			 */
			Hooks.callAll(
				`blackFlag.build${spellcasting.type.capitalize()}SpellcastingTable`, table, item, spellcasting
			);
		}

		return table;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch data for each class feature listed.
	 * @param {BlackFlagItem} item - Class or subclass item belonging to this journal.
	 * @returns {object[]}   Prepared features.
	 */
	async _getFeatures(item) {
		let features = [];
		for ( const advancement of item.system.advancement.byType("grantFeatures") ) {
			const level = advancement.level.value;
			features.push(...advancement.configuration.pool.map(d => this._prepareFeature(item, d.uuid, level)));
		}

		for ( const advancement of item.system.advancement.byType("improvement") ) {
			features.push({
				level: advancement.level.value,
				name: advancement.titleForLevel(),
				document: advancement,
				description: advancement.journalSummary()
			});
		}

		features.push({
			level: CONFIG.BlackFlag.subclassLevel,
			name: game.i18n.format("BF.Subclass.LabelSpecific", { class: item.name }),
			description: game.i18n.localize("BF.JournalPage.Class.Subclass.AdvancementDescription.Placeholder")
		});

		return (await Promise.all(features)).sort((lhs, rhs) => lhs.level - rhs.level);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare a feature document for display.
	 * @param {BlackFlagItem} item - Class or subclass item belonging to this journal.
	 * @param {BlackFlagItem} uuid - UUID of the feature to prepare.
	 * @param {number} level - Level in which the feature is displayed.
	 * @returns {object}
	 */
	async _prepareFeature(item, uuid, level) {
		const document = await fromUuid(uuid);
		return {
			level, document, name: document.name,
			description: await TextEditor.enrichHTML(document.system.description.value, {
				relativeTo: item, secrets: false, async: true
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _renderInner(...args) {
		const html = await super._renderInner(...args);
		this.toc = JournalEntryPage.buildTOC(html.get());
		return html;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll("[data-action]") ) {
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
				if ( !uuidToDelete ) return;
				switch (container.dataset.itemType) {
					case "class":
						await this.document.update({"system.item": ""});
						return this.render();
				}
				break;
			case "launch-text-editor":
				const label = event.target.closest("label");
				return new JournalEditor(this.document, {
					textKeyPath: properties.target, title: label?.innerText
				}).render(true);
			default:
				return log(`Unrecognized action: ${action}`, { level: "warn" });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);

		if ( data?.type !== "Item" ) return false;
		const item = await Item.implementation.fromDropData(data);
		switch ( item.type ) {
			case "class":
				await this.document.update({"system.item": item.uuid});
				return this.render();
			default:
				return false;
		}
	}
}
