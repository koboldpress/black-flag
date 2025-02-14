import BlackFlagActiveEffect from "../../documents/active-effect.mjs";
import { formatWeight } from "../../utils/_module.mjs";
import EffectsElement from "../components/effects.mjs";
import InventoryElement from "../components/inventory.mjs";
import DragDrop from "../drag-drop.mjs";
import NotificationTooltip from "../notification-tooltip.mjs";
import DocumentSheetMixin from "../mixins/document-sheet-mixin.mjs";
import AbilityConfig from "./config/ability-config.mjs";
import ArmorClassConfig from "./config/armor-class-config.mjs";
import HealthConfig from "./config/health-config.mjs";
import InitiativeConfig from "./config/initiative-config.mjs";
import LanguageConfig from "./config/language-config.mjs";
import LuckConfig from "./config/luck-config.mjs";
import MovementConfig from "./config/movement-config.mjs";
import ProficiencyConfig from "./config/proficiency-config.mjs";
import ResistanceConfig from "./config/resistance-config.mjs";
import SensesConfig from "./config/senses-config.mjs";
import SkillConfig from "./config/skill-config.mjs";
import ToolConfig from "./config/tool-config.mjs";
import TypeConfig from "./config/type-config.mjs";

/**
 * Sheet class containing implementation shared across all actor types.
 */
export default class BaseActorSheet extends DocumentSheetMixin(ActorSheet) {
	/**
	 * Fields that will be enriched during data preparation.
	 * @type {object}
	 */
	static enrichedFields = {};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * IDs for items on the sheet that have their descriptions expanded in-line.
	 * @type {Set<string>}
	 */
	expanded = new Set();

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Filters that can be applied to different item lists.
	 * @type {Record<string, Record<string, number>>}
	 */
	filters = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	modes = {
		conditionAdd: false,
		editing: false
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sorting mode applied to different item lists.
	 * @type {Record<string, string>}
	 */
	sorting = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get template() {
		return `systems/black-flag/templates/actor/${this.actor.type}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.appID = this.id;
		context.CONFIG = CONFIG.BlackFlag;
		context.system = this.document.system;
		context.source = this.document.toObject().system;

		context.effects = EffectsElement.prepareActorContext(this.document.allApplicableEffects());

		await this.prepareActions(context);
		await this.prepareItems(context);
		await this.prepareTraits(context);

		const enrichmentContext = {
			relativeTo: this.actor,
			rollData: this.actor.getRollData(),
			secrets: this.actor.isOwner,
			async: true
		};
		context.enriched = {};
		for (const [key, path] of Object.entries(this.constructor.enrichedFields)) {
			context.enriched[key] = await TextEditor.enrichHTML(foundry.utils.getProperty(context, path), enrichmentContext);
		}
		context.editorSelected = this.editorSelected;

		const token = this.actor.isToken ? this.actor.token : this.actor.prototypeToken;
		context.showTokenArtwork = this.modes.editing || this.actor.img !== token.texture.src;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare activity context within the inventory list.
	 * @param {Activity} activity - Activity to prepare.
	 * @returns {object}
	 */
	prepareActivity(activity) {
		return activity.listContext;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare actions for display.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 */
	async prepareActions(context) {
		context.actions = Object.entries(CONFIG.BlackFlag.actionTypes.localized).reduce((obj, [key, label]) => {
			obj[key] = { label, activities: [] };
			return obj;
		}, {});
		context.actions.other = { label: game.i18n.localize("BF.ACTIVATION.Type.Other"), activities: [] };
		for (const item of this.actor.items) {
			if (!item.system.displayActions) continue;
			for (const activity of item.system.actions?.() ?? []) {
				if (!activity.displayAction) continue;
				const data = {
					activity,
					item: activity.item,
					label: activity.activationLabel,
					activationTooltip: activity.activation.condition,
					usesColumn: activity.usesColumn,
					challengeColumn: activity.challengeColumn,
					effectColumn: activity.effectColumn
				};
				if (activity.actionType in context.actions) context.actions[activity.actionType].activities.push(data);
				else context.actions.other.activities.push(data);
			}
		}
		await this.prepareSpecialActions(context.actions);
		for (const [key, value] of Object.entries(context.actions)) {
			if (!value.activities.length) delete context.actions[key];
			else
				context.actions[key].activities.sort((lhs, rhs) => (lhs.item?.sort ?? Infinity) - (rhs.item?.sort ?? Infinity));
		}
		// TODO: Figure out how these should be sorted
	}

	/**
	 * Prepare any additional actions not covered by activities.
	 * @param {Record<string, {label: string, actions: object[]}>} actions - Action sections already prepared.
	 */
	async prepareSpecialActions(actions) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the items for display on the sheet.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 * @abstract
	 */
	async prepareItems(context) {
		context.itemContext ??= {};
		context.sections = await InventoryElement.organizeItems(this.actor, this.actor.items, {
			callback: async (item, section) => {
				const itemContext = (context.itemContext[item.id] ??= {});
				await this.prepareItem(item, itemContext, section);
			},
			hide: !this.modes.editing
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare context data for a specific item.
	 * @param {BlackFlagItem} item - Item being prepared.
	 * @param {object} context - Context object for this item.
	 * @param {object} section - Sheet section within which this item will be displayed.
	 */
	async prepareItem(item, context, section) {
		context.activities = item.system.activities?.map(this.prepareActivity.bind(this));

		context.buttons ??= [];
		context.dataset ??= {};
		if ((item.system.activities?.size || item.transferredEffects.length) && section.tab === "features")
			context.buttons.push({
				action: "enable",
				classes: "status",
				disabled: !item.isOwner,
				label: "BF.Feature.Enabled",
				pressed: item.enabled,
				title: `BF.Feature.${item.enabled ? "Enabled" : "Disabled"}`,
				icon: `<i class="fa-regular ${item.enabled ? "fa-square-check" : "fa-square"}"></i>`
			});

		if (this.expanded.has(item.id)) context.expanded = await item.getSummaryContext({ secrets: this.actor.isOwner });

		context.canDelete = section.options?.canDelete !== false;
		context.canDuplicate = section.options?.canDuplicate !== false;

		const totalWeight = await item.system.totalWeight;
		context.weight = totalWeight
			? formatWeight(totalWeight.toNearest(0.1), item.system.weight.units, { unitDisplay: "short" })
			: "—";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare various traits that might be displayed on the actor's sheet.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 */
	async prepareTraits(context) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _renderOuter() {
		const jQuery = await super._renderOuter();

		// Adjust header button HTML to allow for more precise styling
		for (const button of jQuery[0].querySelectorAll(".header-button")) {
			let content = "";
			for (const node of button.childNodes) {
				if (node instanceof Text) {
					if (!node.textContent.trim().replaceAll("\n", "")) content += node.textContent;
					else {
						content += `<span>${node.textContent}</span>`;
						button.dataset.tooltip = node.textContent.trim();
						button.setAttribute("aria-label", node.textContent.trim());
					}
				} else content += node.outerHTML;
			}
			button.innerHTML = content;
		}

		return jQuery;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		NotificationTooltip.activateListeners(this.actor, html);

		for (const element of html.querySelectorAll(".item-tooltip")) this._applyItemTooltip(element);

		for (const element of html.querySelectorAll("[data-action]")) {
			element.addEventListener("click", this._onAction.bind(this));
			element.addEventListener("contextmenu", event => {
				if (event.ctrlKey) this._onAction(event);
			});
		}

		// Hit Points
		for (const element of html.querySelectorAll('[name$=".hp.value"]')) {
			element.addEventListener("change", this._onChangeHP.bind(this));
		}

		if (!this.modes.editing) {
			for (const element of html.querySelectorAll(".profile")) {
				element.addEventListener("click", this._onShowArtwork.bind(this));
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add tooltips to inventory items.
	 * @param {HTMLElement} element - The element to get a tooltip.
	 * @protected
	 */
	_applyItemTooltip(element) {
		if ("tooltip" in element.dataset) return;

		const target = element.closest("[data-item-id], [data-effect-id], [data-uuid]");
		let { uuid, effectId, itemId, parentId } = target?.dataset ?? {};
		if (!uuid && itemId) uuid = this.actor.items.get(itemId)?.uuid;
		else if (!uuid && effectId) {
			const collection = parentId ? this.actor.items.get(parentId)?.effects : this.actor.effects;
			uuid = collection.get(effectId)?.uuid;
		}
		if (!uuid) return;

		element.dataset.tooltip = `<section class="loading" data-uuid="${uuid}"></section>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_disableFields(form) {
		super._disableFields(form);
		for (const button of form.querySelectorAll('[data-action="expand"], [data-action="view"]')) {
			button.disabled = false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a click on an action link.
	 * @param {ClickEvent} event - Triggering click event.
	 * @param {DOMStringMap} [dataset] - Dataset to use instead of that of the event target.
	 * @returns {Promise}
	 */
	async _onAction(event, dataset) {
		const { action, subAction, ...properties } = dataset ?? event.currentTarget.dataset;
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
					case "ability":
						return new AbilityConfig({ document: this.actor, selectedId: properties.key }).render({ force: true });
					case "armor-class":
						return new ArmorClassConfig({ document: this.actor }).render({ force: true });
					case "health":
						return new HealthConfig({ document: this.actor }).render({ force: true });
					case "initiative":
						return new InitiativeConfig(this.actor).render(true);
					case "language":
						return new LanguageConfig(this.actor).render(true);
					case "luck":
						return new LuckConfig(this.actor).render(true);
					case "movement":
						return new MovementConfig({ document: this.actor }).render({ force: true });
					case "proficiency":
						return new ProficiencyConfig(this.actor).render(true);
					case "resistance":
						return new ResistanceConfig({ document: this.actor }).render({ force: true });
					case "senses":
						return new SensesConfig(this.actor).render(true);
					case "skill":
						return new SkillConfig(properties.key, this.actor).render(true);
					case "tool":
						return new ToolConfig(properties.key, this.actor).render(true);
					case "type":
						return new TypeConfig({ document: this.actor }).render({ force: true });
					case "vehicle":
						return new ToolConfig(properties.key, this.actor, { trait: "vehicles" }).render(true);
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
				return this.actor.rest({ type: properties.type });
			case "roll":
				properties.event = event;
				return this.actor.roll(subAction, properties);
			case "toggle-mode":
				this.modes[properties.type] = !this.modes[properties.type];
				return this.render();
		}
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
		if (value.startsWith("+") || value.startsWith("-")) delta = parseInt(value);
		else {
			if (value.startsWith("=")) value = value.slice(1);
			delta = parseInt(value) - foundry.utils.getProperty(this.actor, event.target.name);
		}

		const changed = await this.actor.applyDamage(delta, { multiplier: -1 });
		if (!changed) event.target.value = foundry.utils.getProperty(this.actor, event.target.name);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_onEditImage(event) {
		const attr = event.currentTarget.dataset.edit;
		const current = foundry.utils.getProperty(this.object, attr);
		const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
		const fp = new FilePicker({
			current,
			type: "image",
			redirectToRoot: img ? [img] : [],
			callback: path => {
				event.currentTarget.src = path;
				if (this.options.submitOnChange) return this._onSubmit(event, { updateData: { [attr]: path } });
			},
			top: this.position.top + 40,
			left: this.position.left + 10,
			document: this.document
		});
		return fp.browse();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle showing the actor's portrait or token artwork.
	 * @param {PointerEvent} event - Triggering click event.
	 */
	_onShowArtwork(event) {
		const path = event.target.src;
		new ImagePopout(path, { title: this.actor.name, uuid: this.actor.uuid }).render(true);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDrop(event) {
		const { data } = DragDrop.getDragData(event);

		// TODO: Handle folders
		// Forward dropped effects to the effects element
		if (data.type === "ActiveEffect") {
			if (Hooks.call("dropActorSheetData", this.actor, this, data) === false) return;
			EffectsElement.dropEffects(event, this.actor, [await ActiveEffect.implementation.fromDropData(data)]);
			return;
		}

		// Forward dropped items to the inventory element
		else if (data.type === "Item") {
			if (Hooks.call("dropActorSheetData", this.actor, this, data) === false) return;
			InventoryElement.dropItems(event, this.actor, [await Item.implementation.fromDropData(data)]);
			return;
		}

		super._onDrop(event);
	}
}
