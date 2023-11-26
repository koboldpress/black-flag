import BlackFlagActiveEffect from "../../documents/active-effect.mjs";
import { log, numberFormat, sortObjectEntries } from "../../utils/_module.mjs";
import NotificationTooltip from "../notification-tooltip.mjs";
import AbilityConfig from "./config/ability-config.mjs";
import ArmorClassConfig from "./config/armor-class-config.mjs";
import InitiativeConfig from "./config/initiative-config.mjs";
import SkillConfig from "./config/skill-config.mjs";

/**
 * Sheet class containing implementation shared across all actor types.
 */
export default class BaseActorSheet extends ActorSheet {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sheet modes that can be active.
	 * @type {{[key: string]: boolean]}}
	 */
	modes = {
		conditionAdd: false,
		editing: false
	};

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

		context.modes = this.modes;

		context.effects = BlackFlagActiveEffect.prepareSheetSections(
			this.document.allApplicableEffects(), { displaySource: true }
		);

		await this.prepareActions(context);
		await this.prepareConditions(context);
		await this.prepareItems(context);
		await this.prepareTraits(context);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare actions for display.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 */
	async prepareActions(context) {
		context.actions = Object.entries(CONFIG.BlackFlag.actionTypes.standard.children.localizedPlural)
			.reduce((obj, [key, label]) => {
				obj[key] = { label, activities: [] };
				return obj;
			}, {});
		for ( const item of this.actor.items ) {
			for ( const action of item.system.actions?.() ?? [] ) {
				if ( action.actionType in context.actions ) context.actions[action.actionType].activities.push(action);
				else context.actions.other.activities.push(action);
			}
		}
		// TODO: Figure out how these should be sorted
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare conditions for display.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 */
	async prepareConditions(context) {
		context.conditions = {};
		if ( this.modes.conditionAdd ) {
			for ( const effect of CONFIG.statusEffects ) {
				const document = CONFIG.BlackFlag.registration.get("condition", effect.id)?.cached;
				if ( context.system.conditions[effect.id] || !document ) continue;
				context.conditions[effect.id] = {
					label: effect.name,
					levels: null,
					document,
					value: 0
				};
			}
		} else {
			for ( const [id, value] of Object.entries(context.system.conditions) ) {
				const document = CONFIG.BlackFlag.registration.get("condition", id)?.cached;
				if ( !document ) continue;
				const levels = document.system.levels.length || 1;
				context.conditions[id] = {
					label: document.name,
					levels: Array.fromRange(levels).map(idx => ({
						number: numberFormat(idx + 1),
						selected: value > idx,
						description: document.system.levels[idx]?.effect?.description
							|| (levels === 1 ? document.system.description.value : "") // TODO: Enrich this!
					})),
					document,
					value
				};
			}
		}
		context.conditions = sortObjectEntries(context.conditions, "label");
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
				if ( !this.modes.editing && section.options?.autoHide && !section.items.length ) delete tab[key];
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
			const toAdd = config.expand ? config.expand(this.actor, config) : [config];
			toAdd.forEach(c => tab[c.id] = { ...c, items: [] });
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
				for ( const type of section.types ?? [] ) {
					if ( checkFilter(item, type) ) {
						section.items.push(item);
						return section;
					}
				}
			}
		}

		// No matching section found, add to uncategorized section if editing mode is enabled
		if ( !this.modes.editing ) return;
		const firstTab = Object.keys(sections)[0];
		const section = sections[firstTab].uncategorized ??= {
			label: game.i18n.localize("BF.Item.Type.Unidentified[other]"), items: []
		};
		section.items.push(item);
		return section;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare various traits that might be displayed on the actor's sheet.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 */
	async prepareTraits(context) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		if ( this.options.editable && (game.user.isGM || this.actor.isOwner) ) {
			const closeIndex = buttons.findIndex(btn => btn.label === "Sheet");
			const getLabel = () => this.modes.editing ? "BF.EditingMode.Editable" : "BF.EditingMode.Locked";
			const getIcon = () => `fa-solid fa-lock${this.modes.editing ? "-open" : ""}`;
			buttons.splice(closeIndex, 0, {
				label: getLabel(),
				class: "toggle-editing-mode",
				icon: getIcon(),
				onclick: ev => {
					this.modes.editing = !this.modes.editing;
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
			case "condition":
				const condition = event.target.closest("[data-condition]")?.dataset.condition;
				switch (subAction) {
					case "add":
						this.modes.conditionAdd = !this.modes.conditionAdd;
						return this.render();
					case "delete":
						return this.actor.system.setConditionLevel(condition);
					case "set-level":
						this.modes.conditionAdd = false;
						return this.actor.system.setConditionLevel(condition, Number(properties.level));
				}
				break;
			case "config":
				switch (properties.type) {
					case "ability": return new AbilityConfig(properties.key, this.actor).render(true);
					case "armor-class": return new ArmorClassConfig(this.actor).render(true);
					case "initiative": return new InitiativeConfig(this.actor).render(true);
					case "skill": return new SkillConfig(properties.key, this.actor).render(true);
				}
				break;
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
				break;
			case "rest":
				return this.actor.rest({type: properties.type});
			case "roll":
				properties.event = event;
				return this.actor.roll(subAction, properties);
			case "toggle-mode":
				this.modes[properties.type] = !this.modes[properties.type];
				return this.render();
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
