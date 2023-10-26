import BlackFlagActiveEffect from "../../documents/active-effect.mjs";
import log from "../../utils/logging.mjs";
import NotificationTooltip from "../notification-tooltip.mjs";
import AbilityConfig from "./config/ability-config.mjs";
import SkillConfig from "./config/skill-config.mjs";

/**
 * Sheet class containing implementation shared across all actor types.
 */
export default class BaseActorSheet extends ActorSheet {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the sheet currently in editing mode?
	 * @type {boolean}
	 */
	editingMode = false;

	/* <><><><> <><><><> <><><><> <><><><> */

	get template() {
		return `systems/black-flag/templates/actor/${this.actor.type}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.appID = this.id;
		context.CONFIG = CONFIG.BlackFlag;
		context.system = this.document.system;
		context.source = this.document.toObject().system;

		context.editingMode = this.editingMode;

		context.effects = BlackFlagActiveEffect.prepareSheetSections(
			this.document.allApplicableEffects(), { displaySource: true }
		);

		await this.prepareItems(context);
		await this.prepareLists(context);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the items for display on the sheet.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 * @abstract
	 */
	async prepareItems(context) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort provided items into sections defined in `CONFIG.BlackFlag.sheetSections` for this actor type.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 * @param {async Function} callback - Method called for each item after it is added to a section.
	 */
	async _prepareItemSections(context, callback) {
		context.sections = this._buildSections();

		for ( const item of Array.from(context.actor.items).sort((a, b) => a.sort - b.sort) ) {
			const section = this._organizeItem(item, context.sections);
			if ( callback ) await callback(item, section);
		}

		for ( const tab of Object.values(context.sections) ) {
			for ( const [key, section] of Object.entries(tab) ) {
				if ( !this.editingMode && section.options?.autoHide && !section.items.length ) delete tab[key];
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Construct sheet sections based on data in `CONFIG.BlackFlag.sheetSections`.
	 * @returns {object}
	 * @internal
	 */
	_buildSections() {
		const sections = {};

		for ( const config of CONFIG.BlackFlag.sheetSections[this.actor.type] ?? {} ) {
			const tab = sections[config.tab] ??= {};
			tab[config.id] = {
				config,
				label: game.i18n.localize(config.label),
				items: [],
				options: config.options
			};
		}

		return sections;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Place an item in the appropriate section.
	 * @param {BlackFlagItem} item - Item to organize.
	 * @param {object} sections - Sections to populate.
	 * @returns {object} - Section into which the item was inserted.
	 * @internal
	 */
	_organizeItem(item, sections) {
		const checkFilter = (item, filter) => Object.entries(filter)
			.every(([key, value]) => foundry.utils.getProperty(item, key) === value);

		for ( const tab of Object.values(sections) ) {
			for ( const section of Object.values(tab) ) {
				for ( const type of section.config?.types ?? [] ) {
					if ( checkFilter(item, type) ) {
						section.items.push(item);
						return section;
					}
				}
			}
		}

		// No matching section found, add to uncategorized section if editing mode is enabled
		if ( !this.editingMode ) return;
		const firstTab = Object.keys(sections)[0];
		const section = sections[firstTab].uncategorized ??= {
			label: game.i18n.localize("BF.Item.Type.Unidentified[other]"), items: []
		};
		section.items.push(item);
		return section;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare various lists that might be displayed on the actor's sheet.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 */
	async prepareLists(context) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		if ( this.options.editable && (game.user.isGM || this.actor.isOwner) ) {
			const closeIndex = buttons.findIndex(btn => btn.label === "Sheet");
			const getLabel = () => this.editingMode ? "BF.EditingMode.Editable" : "BF.EditingMode.Locked";
			const getIcon = () => `fa-solid fa-lock${this.editingMode ? "-open" : ""}`;
			buttons.splice(closeIndex, 0, {
				label: getLabel(),
				class: "toggle-editing-mode",
				icon: getIcon(),
				onclick: ev => {
					this.editingMode = !this.editingMode;
					ev.currentTarget.innerHTML = `<i class="${getIcon()}"></i> ${game.i18n.localize(getLabel())}`;
					this.render();
				}
			});
		}
		return buttons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		NotificationTooltip.activateListeners(this.actor, html);

		for ( const element of html.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", this._onAction.bind(this));
		}

		// Hit Points
		for ( const element of html.querySelectorAll('[name$=".hp.value"]') ) {
			element.addEventListener("change", this._onChangeHP.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a click on an action link.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async _onAction(event) {
		const { action, subAction, ...properties } = event.currentTarget.dataset;
		switch (action) {
			case "config":
				switch (properties.type) {
					case "ability": return new AbilityConfig(properties.key, this.actor).render(true);
					case "skill": return new SkillConfig(properties.key, this.actor).render(true);
				}
			case "effect":
				return BlackFlagActiveEffect.onEffectAction.bind(this)(event);
			case "item":
				const itemId = properties.itemId ?? event.target.closest("[data-item-id]")?.dataset.itemId;
				const item = this.actor.items.get(itemId);
				switch (subAction) {
					case "delete":
						return item?.deleteDialog();
					case "edit":
					case "view":
						return item?.sheet.render(true);
				}
			case "rest":
				return this.actor.rest({type: properties.type});
			case "roll":
				properties.event = event;
				return this.actor.roll(subAction, properties);
		}
		return log(`Unrecognized action: ${action}/${subAction}`, { level: "warn" });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle changes to the HP and damage on character sheets.
	 * @param {Event} event - Triggering event.
	 * @returns {Promise}
	 */
	async _onChangeHP(event) {
		event.stopPropagation();
		let value = event.target.value.trim();
		let delta;
		if ( value.startsWith("+") || value.startsWith("-") ) delta = parseInt(value);
		else {
			if ( value.startsWith("=") ) value = value.slice(1);
			delta = parseInt(value) - foundry.utils.getProperty(this.actor, event.target.name);
		}

		const changed = await this.actor.applyDamage(delta, { multiplier: -1 });
		if ( !changed ) event.target.value = foundry.utils.getProperty(this.actor, event.target.name);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);

		// Preserve item updates to send to items
		const itemUpdates = Object.entries(updates.item ?? {}).map(([_id, data]) => {
			return { _id, ...data };
		});
		delete updates.item;

		await super._updateObject(event, foundry.utils.flattenObject(updates));
		await this.actor.updateEmbeddedDocuments("Item", itemUpdates);
	}
}
