import ActivityChoiceDialog from "../applications/activity/activity-choice-dialog.mjs";
import ActivitiesTemplate from "../data/item/templates/activities-template.mjs";
import PhysicalTemplate from "../data/item/templates/physical-template.mjs";
import { slugify } from "../utils/text.mjs";
import DocumentMixin from "./mixins/document.mjs";
import NotificationsCollection from "./notifications.mjs";
import Scaling from "./scaling.mjs";

export default class BlackFlagItem extends DocumentMixin(Item) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Accent color used for certain parts of the UI.
	 * @type {string}
	 */
	get accentColor() {
		if (this.system.color) return this.system.color;
		return this.system.metadata?.accentColor ?? "var(--bf-blue)";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Base Map used to ensure tags are always displayed in order.
	 * @type {Map<string, string>}
	 */
	static get baseTags() {
		return new Map(
			[
				"type",
				"details",
				"activity",
				"activation",
				"range",
				"affects",
				"template",
				"duration",
				"equipped",
				"attuned",
				"proficient"
			].map(l => [l, null])
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Tags that should be displayed in chat.
	 * @type {Map<string, string>}
	 */
	get chatTags() {
		const tags = this.constructor.baseTags;
		tags.set("type", game.i18n.localize(CONFIG.Item.typeLabels[this.type]));
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The item that contains this item, if it is in a container. Returns a promise if the item is located
	 * in a compendium pack.
	 * @type {BlackFlagItem|Promise<BlackFlagItem>|void}
	 */
	get container() {
		if (!this.system.container) return;
		if (this.isEmbedded) return this.actor.items.get(this.system.container);
		if (this.pack) return game.packs.get(this.pack).getDocument(this.system.container);
		return game.items.get(this.system.container);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this item currently enabled? Non-enabled items won't display in the actions list.
	 * @type {boolean}
	 */
	get enabled() {
		return this.flags["black-flag"]?.relationship?.enabled !== false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get identifier() {
		if (this.system.identifier?.value) return this.system.identifier.value;
		return slugify(identifier, { strict: true });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Collection of notifications that should be displayed on the actor sheet.
	 */
	notifications = this.notifications;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get pseudoDocumentHierarchy() {
		const hierarchy = {};
		for (const [fieldName, field] of this.system.schema.entries()) {
			if (field.constructor.hierarchical) hierarchy[fieldName] = field;
		}
		Object.defineProperty(this, "pseudoDocumentHierarchy", { value: Object.freeze(hierarchy), writable: false });
		return this.pseudoDocumentHierarchy;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Scaling increase for this item based on flag or item-type specific details.
	 * @type {number}
	 */
	get scaling() {
		return this.system?.scaling ?? this.getFlag(game.system.id, "scaling") ?? 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Data Initialization         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	clone(data = {}, options = {}) {
		if (options.save) return super.clone(data, options);
		if (this.parent) this.parent._embeddedPreparation = true;
		const item = super.clone(data, options);
		if (item.parent) {
			item.parent._embeddedPreparation = false;
			item.system.prepareFinalData?.();
		}
		return item;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_initializeSource(data, options = {}) {
		if (data instanceof foundry.abstract.DataModel) data = data.toObject();

		const activities = foundry.utils.getProperty(data, "system.activities");
		if (activities)
			Object.values(activities).forEach(data => {
				if (data.type === "healing") data.type = "heal";
				else if (data.type === "savingThrow") data.type = "save";
			});
		if (!data.system?.identifier?.value) {
			foundry.utils.setProperty(data, "system.identifier.value", slugify(data.name, { strict: true }));
		}
		return super._initializeSource(data, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		source = super.migrateData(source);
		ActivitiesTemplate._migrateActivityActivationOverride?.(source);
		return source;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		this.notifications = new NotificationsCollection();
		super.prepareData();
		if (this.system.shouldPrepareFinalData) this.system.prepareFinalData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareEmbeddedDocuments() {
		super.prepareEmbeddedDocuments();
		for (const collectionName of Object.keys(this.pseudoDocumentHierarchy ?? {})) {
			for (const e of this.getEmbeddedCollection(collectionName)) {
				e.prepareData();
			}
		}
		if (!this.actor || this.actor._embeddedPreparation) this.applyActiveEffects();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get all ActiveEffects that may apply to this Item.
	 * @yields {BlackFlagActiveEffect}
	 * @returns {Generator<BlackFlagActiveEffect, void, void>}
	 */
	*allApplicableEffects() {
		for (const effect of this.effects) {
			if (effect.type === "enchantment") yield effect;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply any transformation to the Item data which are caused by enchantment Effects.
	 */
	applyActiveEffects() {
		const overrides = {};

		// Organize non-disabled effects by their application priority
		const changes = [];
		for (const effect of this.allApplicableEffects()) {
			if (!effect.active) continue;
			changes.push(
				...effect.changes.map(change => {
					const c = foundry.utils.deepClone(change);
					c.effect = effect;
					c.priority ??= c.mode * 10;
					return c;
				})
			);
		}
		changes.sort((a, b) => a.priority - b.priority);

		// Apply all changes
		for (const change of changes) {
			if (!change.key) continue;
			const changes = change.effect.apply(this, change);
			Object.assign(overrides, changes);
		}

		// Expand the set of final overrides
		this.overrides = foundry.utils.expandObject(overrides);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Activate this item, posting to chat if no activities are set, triggering the only activity if only one is present,
	 * and displaying an activity choice dialog if more than one is available.
	 * @param {Partial<ActivityActivationConfiguration>} [config={}] - Configuration info for the activation.
	 * @param {Partial<ActivityDialogConfiguration>} [dialog={}] - Configuration info for the configuration dialog.
	 * @param {Partial<ActivityMessageConfiguration>} [message={}] - Configuration info for the chat message created.
	 */
	async activate(config = {}, dialog = {}, message = {}) {
		if (this.system.activities?.size && !this.pack) {
			let activity = this.system.activities.contents[0];
			// TODO: Handle proper skip-dialog keybindings
			if (this.system.activities.size > 1 && !config.event?.shiftKey) {
				activity = await ActivityChoiceDialog.create(this);
			}
			activity?.activate(config, dialog, message);
		} else if (this.actor) {
			this.postToChat(message);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get advancement for this item.
	 * @param {number|AdvancementLevels} levels - Level for which to get the advancement.
	 * @yields {Advancement}
	 */
	*advancementForLevel(levels = 0) {
		if (foundry.utils.getType(levels) === "number") {
			for (const advancement of this.system.advancement?.byLevel(levels) ?? []) {
				yield advancement;
			}
		} else {
			for (const advancement of this.system.advancement ?? []) {
				const level = advancement.relavantLevel(levels);
				if (advancement.levels.includes(level)) yield advancement;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async deleteDialog(options = {}) {
		// Display custom delete dialog when deleting a container with contents
		const count = await this.system.contentsCount;
		if (count) {
			return Dialog.confirm({
				title: `${game.i18n.format("DOCUMENT.Delete", {
					type: game.i18n.localize("BF.Item.Type.Container[one]")
				})}: ${this.name}`,
				content: `<h4>${game.i18n.localize("AreYouSure")}</h4>
					<p>${game.i18n.format("BF.Container.Delete.Message", { count })}</p>
					<label>
						<input type="checkbox" name="deleteContents">
						${game.i18n.localize("BF.Container.Delete.Contents")}
					</label>`,
				yes: html => {
					const deleteContents = html.querySelector('[name="deleteContents"]').checked;
					this.delete({ deleteContents });
				},
				options: { ...options, jQuery: false }
			});
		}

		return super.deleteDialog(options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Attack formula and activity for the default attack this item might have.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{parts: string[], data: object, formula: string, activity: Activity}|null}
	 */
	getAttackDetails(options = {}) {
		for (const activity of this.system.activities ?? []) {
			const details = activity.getAttackDetails?.(options);
			if (details) return details;
		}
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Damage formulas and activity for the default attack this item might have.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{rolls: DamageRollConfiguration[], activity: Activity}|null}
	 */
	getDamageDetails(options = {}) {
		for (const activity of this.system.activities ?? []) {
			const details = activity.getDamageDetails?.(options);
			if (details) return details;
		}
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getRollData(options = {}) {
		let rollData;
		if (this.system.getRollData) rollData = this.system.getRollData(options);
		else {
			rollData = { ...(this.actor.getRollData(options) ?? {}), item: { ...this.system } };
		}

		if (rollData.item) {
			rollData.item.flags = { ...this.flags };
			rollData.item.name = this.name;
		}

		const abilityKey = this.system.ability;
		if (abilityKey && "abilities" in rollData) {
			rollData.mod = rollData.abilities[abilityKey]?.mod ?? 0;
		}

		rollData.scaling = new Scaling(this.scaling);

		return rollData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Save ability, dc, and activity for the default save this item might have.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{ability: string, dc: string, activity: Activity}|null}
	 */
	getSaveDetails(options = {}) {
		for (const activity of this.system.activities ?? []) {
			const details = activity.getSaveDetails?.(options);
			if (details) return details;
		}
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the data used to present an expanded summary for this item.
	 * @param {object} [enrichmentOptions={}] - Options passed to `TextEditor.enrichHTML`.
	 * @returns {object} - Context passed to the template for rendering the summary.
	 */
	async getSummaryContext(enrichmentOptions = {}) {
		const context = {
			enriched: {
				description: await TextEditor.enrichHTML(this.system.description.value, {
					async: true,
					relativeTo: this,
					rollData: this.getRollData(),
					...enrichmentOptions
				})
			},
			item: this,
			system: this.system
		};
		await this.system.getSummaryContext?.(context, enrichmentOptions);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Post this item's description to chat.
	 * @param {Partial<ActivityMessageConfiguration>} [message={}] - Configuration info for the chat message created.
	 * @returns {Promise<ChatMessage>}
	 */
	async postToChat(message = {}) {
		const baseContext = {
			item: this,
			actor: this.actor,
			token: this.actor?.token,
			buttons: {},
			tags: Array.from((this.system.chatTags ?? this.chatTags).entries())
				.map(([key, label]) => ({ key, label }))
				.filter(t => t.label),
			description: await TextEditor.enrichHTML(this.system.description?.value ?? "", {
				relativeTo: this,
				rollData: this.getRollData(),
				secrets: false,
				async: true
			})
		};
		const context = this.system.prepareChatContext?.(baseContext) ?? baseContext;

		const messageConfig = foundry.utils.mergeObject(
			{
				rollMode: game.settings.get("core", "rollMode"),
				data: {
					style: CONST.CHAT_MESSAGE_STYLES.OTHER,
					content: await foundry.applications.handlebars.renderTemplate(
						"systems/black-flag/templates/chat/item-card.hbs",
						context
					),
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					flags: {
						core: { canPopout: true },
						"black-flag": {
							type: "item",
							uuid: this.uuid
						}
					}
				}
			},
			message
		);

		ChatMessage.applyRollMode(messageConfig.data, messageConfig.rollMode);

		// TODO: Call preCreateItemMessage hook

		const card = await ChatMessage.create(messageConfig.data);

		// TODO: Call postCreateItemMessage hook

		return card;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Embedded Operations         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static getCollectionName(name) {
		if (name === "Activity") name = "activities";
		if (name === "Advancement") name = "advancement";
		if (["activities", "advancement"].includes(name)) return name;
		return super.getCollectionName(name);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getEmbeddedCollection(embeddedName) {
		const collectionName = this.constructor.getCollectionName(embeddedName);
		const field = this.pseudoDocumentHierarchy[collectionName];
		return field ? this.system[collectionName] : super.getEmbeddedCollection(embeddedName);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritdoc */
	async _preCreate(data, options, user) {
		if ((await super._preCreate(data, options, user)) === false) return false;

		// Create class identifier based on name
		if (Object.hasOwn(this.system.identifier ?? {}, "value") && !this.system.identifier.value) {
			await this.updateSource({ "system.identifier.value": slugify(data.name, { strict: true }) });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		super._onCreate(data, options, userId);
		await this.system.onCreateActivities?.(data, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preUpdate(changed, options, user) {
		if ((await super._preUpdate(changed, options, user)) === false) return false;
		await this.system.preUpdateActivities?.(changed, options, user);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onUpdate(changed, options, userId) {
		super._onUpdate(changed, options, userId);
		await this.system.onUpdateActivities?.(changed, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDelete(options, userId) {
		super._onDelete(options, userId);
		await this.system.onDeleteActivities?.(options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare creation data for the provided items and any items contained within them. The data created by this method
	 * can be passed to `createDocuments` with `keepId` always set to true to maintain links to container contents.
	 * @param {BlackFlagItem[]} items - Items to create.
	 * @param {object} [context={}] - Context for the item's creation.
	 * @param {BlackFlagItem} [context.container] - Container in which to create the item.
	 * @param {boolean} [context.keepId=false] - Should IDs be maintained?
	 * @param {Function} [context.transformAll] - Method called on provided items and their contents.
	 * @param {Function} [context.transformFirst] - Method called only on provided items.
	 * @returns {Promise<object[]>} - Data for items to be created.
	 */
	static async createWithContents(items, { container, keepId = false, transformAll, transformFirst } = {}) {
		let depth = 0;
		if (container) {
			depth = 1 + (await container.system.allContainers()).length;
			if (depth > PhysicalTemplate.MAX_DEPTH) {
				ui.notifications.warn(game.i18n.format("BF.Container.Warning.MaxDepth", { depth: PhysicalTemplate.MAX_DEPTH }));
				return;
			}
		}

		const createItemData = async (item, containerId, depth) => {
			let newItemData = transformAll ? await transformAll(item) : item;
			if (transformFirst && depth === 0) newItemData = await transformFirst(newItemData);
			if (!newItemData) return;
			if (newItemData instanceof Item)
				newItemData = game.items.fromCompendium(newItemData, {
					clearSort: false,
					clearOwnership: false,
					keepId: true
				});
			foundry.utils.mergeObject(newItemData, { "system.container": containerId });
			if (!keepId) newItemData._id = foundry.utils.randomID();

			created.push(newItemData);

			const contents = await item.system.contents;
			if (contents && depth < PhysicalTemplate.MAX_DEPTH) {
				for (const doc of contents) await createItemData(doc, newItemData._id, depth + 1);
			}
		};

		const created = [];
		for (const item of items) await createItemData(item, container?.id, depth);
		return created;
	}
}
