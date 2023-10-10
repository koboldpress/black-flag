import Proficiency from "../../documents/proficiency.mjs";
import { log } from "../../utils/_module.mjs";
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

		const headers = [[{content: game.i18n.localize("BF.Level.Label[one]")}]];
		if ( item.type === "class" ) headers[0].push({content: game.i18n.localize("BF.Proficiency.Bonus.Abbreviation")});
		if ( hasFeatures ) headers[0].push({content: game.i18n.localize("BF.Item.Type.Feature[other]")});

		const cols = [{ class: "level", span: 1 }];
		if ( item.type === "class" ) cols.push({class: "prof", span: 1});
		if ( hasFeatures ) cols.push({class: "features", span: 1});

		const makeLink = async uuid => (await fromUuid(uuid))?.toAnchor({classes: ["content-link"]}).outerHTML;
		// TODO: See if this can be replaced by linkForUUID

		const rows = [];
		for ( const level of Array.fromRange((CONFIG.BlackFlag.maxLevel - (initialLevel - 1)), initialLevel) ) {
			const features = [];
			for ( const advancement of item.system.advancement.byLevel(level) ) {
				switch ( advancement.constructor.typeName ) {
					case "grantFeatures":
						features.push(...await Promise.all(advancement.configuration.pool.map(d => makeLink(d.uuid))));
						break;
				}
			}

			// Level & proficiency bonus
			const cells = [{class: "level", content: level.ordinalString()}]; // TODO: Use proper ordinal localization
			if ( item.type === "class" ) cells.push({class: "prof", content: `+${Proficiency.calculateMod(level)}`});
			if ( hasFeatures ) cells.push({class: "features", content: features.join(", ")});

			rows.push(cells);
		}

		return { headers, cols, rows };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch data for each class feature listed.
	 * @param {BlackFlagItem} item - Class or subclass item belonging to this journal.
	 * @param {boolean} [optional=false] - Should optional features be fetched rather than required features?
	 * @returns {object[]}   Prepared features.
	 */
	async _getFeatures(item, optional=false) {
		const prepareFeature = async uuid => {
			const document = await fromUuid(uuid);
			return {
				document,
				name: document.name,
				description: await TextEditor.enrichHTML(document.system.description.value, {
					relativeTo: item, secrets: false, async: true
				})
			};
		};

		let features = [];
		for ( const advancement of item.system.advancement.byType("grantFeatures") ) {
			features.push(...advancement.configuration.pool.map(d => prepareFeature(d.uuid)));
		}
		return Promise.all(features);
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
