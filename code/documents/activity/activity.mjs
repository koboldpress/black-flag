import ActivityActivationDialog from "../../applications/activity/activity-activation-dialog.mjs";
import BaseActivity from "../../data/activity/base-activity.mjs";
import ConsumptionError from "../../data/activity/consumption-error.mjs";
import { numberFormat } from "../../utils/_module.mjs";
import PseudoDocumentMixin from "../mixins/pseudo-document.mjs";

/**
 * Abstract base class which various activity types can subclass.
 * @param {object} [data={}] - Raw data stored in the activity object.
 * @param {object} [options={}] - Options which affect DataModel construction.
 * @abstract
 */
export default class Activity extends PseudoDocumentMixin(BaseActivity) {
	/**
	 * Information on how an advancement type is configured.
	 *
	 * @typedef {BaseActivityMetadata} ActivityMetadata
	 * @property {typeof DataModel} [dataModel] - Data model for custom system data.
	 * @property {string} icon - Icon used if no user icon is specified.
	 * @property {string} title - Title to be displayed if no user title is specified.
	 * @property {string} hint - Description of this type shown in the activity selection dialog.
	 * @property {object} usage
	 * @property {string} usage.chatCard - Template used to render chat cards.
	 * @property {typeof ActivityActivationDialog} usage.dialog - Application used for the activation dialog by default.
	 */

	/**
	 * Configuration information for this activity type.
	 * @type {ActivityMetadata}
	 */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				icon: "",
				title: "BF.Activity.Label[one]",
				hint: "",
				usage: {
					chatCard: "systems/black-flag/templates/activity/chat/activation-card.hbs",
					dialog: ActivityActivationDialog
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform the pre-localization of this data model.
	 */
	static localize() {
		Localization.localizeDataModel(this);
		if (this.metadata.dataModel) Localization.localizeDataModel(this.metadata.dataModel);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform pre-localization on the contents of a SchemaField. Necessary because the `localizeSchema` method
	 * on `Localization` is private.
	 * @param {SchemaField} schema
	 * @param {string[]} prefixes
	 * @internal
	 */
	static _localizeSchema(schema, prefixes) {
		Localization.localizeDataModel({ schema }, { prefixes });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The action type that is used to activate this activity.
	 * @type {string}
	 */
	get actionType() {
		return this.activation.type;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The label used for activation buttons.
	 * @type {string}
	 */
	get activationLabel() {
		return `BF.Activity.Core.Action.${this.isSpell ? "Cast" : "Use"}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is scaling possible with this activity?
	 * @type {boolean}
	 */
	get canScale() {
		if (!this.consumption.scale.allowed) return false;
		if (!this.isSpell) return true;
		return this.requiresSpellSlot;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the challenge column in the action table.
	 * @type {string}
	 */
	get challengeColumn() {
		return "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Tags that should be displayed in chat.
	 * @type {Map<string, string>}
	 */
	get chatTags() {
		const tags = this.item.system.chatTags ?? this.item.chatTags;
		tags.set("activation", this.activation.label);
		tags.set("duration", this.duration.label);
		if (this.range.units) tags.set("range", this.range.label);
		if (this.target.affects.type) tags.set("affects", this.target.affects.label);
		if (this.target.template.units) tags.set("template", this.target.template.label);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Should this activity be displayed as an action on the character sheet?
	 * @type {boolean}
	 */
	get displayAction() {
		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the effect column in the action table.
	 * @type {string}
	 */
	get effectColumn() {
		return "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contents of the uses column in action table.
	 * @type {string}
	 */
	get usesColumn() {
		const uses = document.createElement("div");
		uses.classList.add("layout");
		if (this.consumption.targets.find(t => t.type === "item")) {
			const itemUses = this.item.system.uses;
			if (itemUses.max) {
				uses.innerHTML += `<span>${numberFormat(itemUses.value)} / ${numberFormat(itemUses.max)}</span>`;
			} else if (itemUses.consumeQuantity && this.item.system.isPhysical) {
				uses.innerHTML += `<span>${numberFormat(this.item.system.quantity)}</span>`;
			}
		}
		if (this.consumption.targets.find(t => t.type === "activity")) {
			uses.innerHTML += `<span>${numberFormat(this.uses.value)} / ${numberFormat(this.uses.max)}</span>`;
		}
		return uses.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this activity on a spell item, or something else?
	 * @type {boolean}
	 */
	get isSpell() {
		// TODO: Potentially allow custom module types to be considered spells
		return this.item.type === "spell";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Data used when fetching modifiers associated with this activity.
	 * @type {object}
	 */
	get modifierData() {
		return {
			activity: this.system,
			actor: this.actor?.getRollData(),
			item: this.item.getRollData()?.item
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does activating this activity consume a spell slot?
	 * @type {boolean}
	 */
	get requiresSpellSlot() {
		if (!this.isSpell || !this.actor?.system.spellcasting?.slots) return false;
		return this.item.system.requiresSpellSlot && this.activation.primary;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareData() {
		this.name = this.name || game.i18n.localize(this.constructor.metadata.title);
		this.img = this.img || this.constructor.metadata.icon;
		this.system.prepareData?.();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareFinalData() {
		super.prepareFinalData();
		this.system.prepareFinalData?.();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*          Embeds & Tooltips          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbedContents(config, options) {
		const div = document.createElement("div");
		div.innerHTML = await TextEditor.enrichHTML(this.description, {
			relativeTo: this,
			secrets: false,
			rollData: this.item.getRollData()
		});
		return div.children;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _createInlineEmbed(content, config, options) {
		if (!config.values?.includes("activate") || !this.item.isEmbedded) {
			return super._createInlineEmbed(content, config, options);
		}

		const section = document.createElement("section");
		if (content instanceof HTMLCollection) section.append(...content);
		else section.append(content);

		let insert = section.children[0];
		if (!insert) {
			insert = document.createElement("p");
			section.append(insert);
		}

		const control = document.createElement("button");
		control.type = "button";
		control.classList.add("inline-caption", "link-button");
		control.dataset.action = "activate";
		control.dataset.activityUuid = this.uuid;
		control.innerText = config.label ?? this.name;
		section.children[0].insertAdjacentElement("afterbegin", control);

		return section;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration data for an activity's activation.
	 *
	 * @typedef {object} ActivityActivationConfiguration
	 * @property {boolean|object} consume - Consumption configuration, set to `false` to prevent all consumption.
	 * @property {boolean} consume.action - Control whether a part of the action economy is used during activation.
	 * @property {boolean|BlackFlagItem} consume.ammunition - Control whether ammunition is consumed by a weapon or
	 *                                                        provide an ammunition item to consume.
	 * @property {boolean|string[]} consume.resources - Set to `true` or `false` to enable or disable all resource
	 *                                                  consumption or provide a list of consumption type keys defined
	 *                                                  in `CONFIG.BlackFlag.consumptionTypes` to only enable those types.
	 * @property {boolean} consume.spellSlot - Control whether spell consumes a spell slot.
	 * @property {boolean|number} scaling - Number of steps above baseline to scale this activation, or `false` if scaling
	 *                                      is not allowed.
	 * @property {object} spell
	 * @property {number} spell.circle - Spell circle to consume. Replaces `scaling` on property for spells.
	 * @property {TargetDescriptor[]} targets - Tokens targeted during activation.
	 */

	/**
	 * Data for the activity activation configuration dialog.
	 *
	 * @typedef {object} ActivityDialogConfiguration
	 * @property {boolean} configure=true - Should the activation configuration dialog be displayed?
	 * @property {typeof ActivityActivationDialog} - applicationClass - Alternate activation dialog to use.
	 */

	/**
	 * Message configuration data used when creating messages.
	 *
	 * @typedef {object} ActivityMessageConfiguration
	 * @property {boolean} create=true - Should a message be created when this roll is complete?
	 * @property {object} data={} - Additional data used when creating the message.
	 * @property {string} template - Template to use for rendering the chat card.
	 */

	/**
	 * Details of final changes performed by the activation.
	 *
	 * @typedef {object} ActivityActivationResults
	 * @property {BlackFlagChatMessage|ActivityMessageConfiguration} message - The chat message created for the
	 *                                                                         activation, or the message data if create
	 *                                                                         was `false`.
	 * @property {ActivationUpdates} updates - Updates to the actor & items.
	 */

	/**
	 * Activate this activity.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivityDialogConfiguration} dialog - Configuration info for the configuration dialog.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the chat message created.
	 */
	async activate(config = {}, dialog = {}, message = {}) {
		let item = this.item.clone({}, { keepId: true });
		item.prepareData();
		item.system.prepareFinalData?.();
		let activity = item.system.activities.get(this.id);

		const activationConfig = activity._prepareActivationConfig(config);

		const dialogConfig = foundry.utils.mergeObject(
			{
				configure: true,
				applicationClass: this.metadata.usage.dialog
			},
			dialog
		);

		const messageConfig = foundry.utils.mergeObject(
			{
				create: true,
				data: {},
				template: this.metadata.usage.chatCard
			},
			message
		);

		// Call preActivate script & hooks
		// TODO: preActivate script
		/**
		 * A hook event that fires before an activity activation is configured.
		 * @function blackFlag.preActivateActivity
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the activity message to be created.
		 * @param {ActivityDialogConfiguration} dialogConfig - Configuration data for the activity activation dialog.
		 * @returns {boolean} - Explicitly return `false` to prevent activity from being activated.
		 */
		if (
			Hooks.call("blackFlag.preActivateActivity", activity, activationConfig, messageConfig, dialogConfig) === false
		) {
			return;
		}

		// Display configuration window if necessary, wait for result
		if (dialogConfig.configure && activity._requiresConfigurationDialog(activationConfig)) {
			try {
				await dialogConfig.applicationClass.create(activity, activationConfig, dialogConfig.options);
			} catch (err) {
				return;
			}
		}

		// Handle scaling
		this._prepareActivationScaling(activationConfig, messageConfig, item);
		activity = item.system.activities.get(this.id);

		// Handle consumption
		const updates = await activity.consume(activationConfig, messageConfig);
		if (updates === false) return;
		const results = { updates };

		// Display the card in chat
		messageConfig.data.rolls = (messageConfig.data.rolls ?? []).concat(updates.rolls);
		if (config.targets?.length) {
			foundry.utils.setProperty(messageConfig, `data.flags.${game.system.id}.targets`, config.targets);
		}
		results.message = await activity.createActivationMessage(messageConfig);

		// Finalize the activation
		await activity._finalizeActivation(activationConfig, results);

		// Call postActivate script & hooks
		// TODO: postActivate script
		/**
		 * A hook event that fires when an activity is activated.
		 * @function blackFlag.postActivateActivity
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityActivationResults} results - Results of the activation.
		 */
		Hooks.callAll("blackFlag.postActivateActivity", activity, activationConfig, results);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Consume this activity's usage.
	 * @param {ActivityActivationConfiguration} activationConfig - Any configuration data provided manually.
	 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the chat message.
	 * @returns {ActivationUpdates|false}
	 */
	async consume(activationConfig, messageConfig) {
		// Call preActivityConsumption script & hooks
		// TODO: preActivityConsumption script
		/**
		 * A hook event that fires before an item's resource consumption is calculated.
		 * @function blackFlag.preActivityConsumption
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the activity message to be created.
		 * @returns {boolean} - Explicitly return `false` to prevent activity from being activated.
		 */
		if (Hooks.call("blackFlag.preActivityConsumption", this, activationConfig, messageConfig) === false) {
			return false;
		}

		// Calculate what resources should be consumed
		const updates = await this._prepareActivationUpdates(activationConfig);
		if (updates === false) return false;

		// Call activityConsumption script & hooks
		// TODO: activityConsumption script
		/**
		 * A hook event that fires after an item's resource consumption is calculated, but before an updates are performed.
		 * @function blackFlag.activityConsumption
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the activity message to be created.
		 * @param {ActivationUpdates} updates - Updates that will be applied to the actor and other documents.
		 * @returns {boolean} - Explicitly return `false` to prevent activity from being activated.
		 */
		if (Hooks.call("blackFlag.activityConsumption", this, activationConfig, messageConfig, updates) === false) {
			return false;
		}

		// Merge activity changes into the item updates
		if (!foundry.utils.isEmpty(updates.activity)) {
			const itemIndex = updates.item.findIndex(i => i._id === this.item.id);
			const keyPath = `system.activities.${this.id}`;
			const activityUpdates = foundry.utils.expandObject(updates.activity);
			if (itemIndex === -1) updates.item.push({ _id: this.item.id, [keyPath]: activityUpdates });
			else updates.item[itemIndex][keyPath] = activityUpdates;
		}

		// Update documents with consumption
		if (!foundry.utils.isEmpty(updates.actor)) await this.actor.update(updates.actor);
		if (!foundry.utils.isEmpty(updates.item)) await this.actor.updateEmbeddedDocuments("Item", updates.item);

		// Call postConsumeUses script & hooks
		// TODO: postActivityConsumption script
		/**
		 * A hook event that fires after an item's resource consumption is calculated and applied.
		 * @function blackFlag.postActivityConsumption
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the activity message to be created.
		 * @param {ActivationUpdates} updates - Updates that have been applied to the actor and other documents.
		 * @returns {boolean} - Explicitly return `false` to prevent activity from being activated.
		 */
		if (Hooks.call("blackFlag.postActivityConsumption", this, activationConfig, messageConfig, updates) === false) {
			return false;
		}

		return updates;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare activation configuration object with the necessary defaults based on the activity and item.
	 * @param {ActivityActivationConfiguration} [config={}] - Any configuration data provided manually.
	 * @returns {ActivityActivationConfiguration}
	 * @protected
	 */
	_prepareActivationConfig(config = {}) {
		config = foundry.utils.deepClone(config);

		if (config.consume !== false) {
			config.consume ??= {};
			config.consume.action ??= this.activation.type === "legendary";
			config.consume.resources ??= this.consumption.targets.length > 0;
			config.consume.spellSlot ??= this.requiresSpellSlot;
		}
		if (!this.canScale) config.scaling = false;
		else config.scaling ??= 0;

		// If all entries within `config.consume` are `false`, replace object with `false`
		if (config.consume !== false) {
			const anyConsumption = Object.values(config.consume).some(v => v);
			if (!anyConsumption) config.consume = false;
		}

		config.targets ??= this.constructor.getTargetDescriptors();

		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine scaling values and update item clone if necessary.
	 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
	 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the chat message.
	 * @param {BlackFlagItem} item - Clone of the item upon which the activation is occurring.
	 * @protected
	 */
	_prepareActivationScaling(activationConfig, messageConfig, item) {
		const scaleUpdate = {};

		if (item.type === "spell") {
			const circle = item.system.tags.has("ritual")
				? this.actor.system.spellcasting?.maxCircle
				: this.actor.system.spellcasting?.slots?.[activationConfig.spell?.slot]?.circle;
			if (circle) {
				foundry.utils.setProperty(
					messageConfig.data,
					`flags.${game.system.id}.spellSlot`,
					activationConfig.spell?.slot
				);
				if (circle !== item.system.circle.base) {
					scaleUpdate["system.circle.value"] = circle;
					activationConfig.scaling = circle - item.system.circle.base;
				}
			}
		}

		if (activationConfig.scaling) {
			scaleUpdate[`flags.${game.system.id}.scaling`] = activationConfig.scaling;
			foundry.utils.setProperty(messageConfig.data, `flags.${game.system.id}.scaling`, activationConfig.scaling);
			item.updateSource(scaleUpdate);
			item.prepareData();
			item.system.prepareFinalData?.();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update data produced by activity activation.
	 *
	 * @typedef {object} ActivationUpdates
	 * @property {object} activity - Updates applied to activity that performed the activation.
	 * @property {object[]} item - Updates applied to items on the actor that performed the activation.
	 * @property {object} actor - Updates applied to the actor that performed the activation.
	 * @property {Roll[]} rolls - Any rolls performed as part of the activation.
	 */

	/**
	 * Calculate changes to actor, items, & this activity based on resource consumption.
	 * @param {ActivityActivationConfiguration} config - Activation configuration.
	 * @returns {ActivationUpdates}
	 * @protected
	 */
	async _prepareActivationUpdates(config) {
		const updates = { activity: {}, item: [], actor: {}, rolls: [] };
		if (!config.consume) return updates;
		const errors = [];

		if ((config.consume === true || config.consume.action) && this.activation.type === "legendary") {
			const count = this.activation.value ?? 1;
			const legendary = this.actor.system.attributes?.legendary;
			if (legendary) {
				let errMessage;
				if (legendary.value === 0) errMessage = "BF.ACTIVATION.Warning.NoActions";
				else if (count > legendary.value) errMessage = "BF.ACTIVATION.Warning.NotEnoughActions";
				if (!errMessage) {
					updates.actor["system.attributes.legendary.spent"] = legendary.spent + count;
				} else {
					const err = new ConsumptionError(
						game.i18n.format(errMessage, {
							type: CONFIG.BlackFlag.actionTypes.localized[this.activation.type],
							required: numberFormat(count),
							available: numberFormat(legendary.value)
						})
					);
					errors.push(err);
					ui.notifications.error(err.message, { console: false });
				}
			}
		}

		if (config.consume === true || config.consume.ammunition) {
			// TODO: Let `WeaponData` to handle this
		}

		if (config.consume === true || config.consume.resources) {
			for (const target of this.consumption.targets) {
				if (
					foundry.utils.getType(config.consume.resources) === "Array" &&
					!config.consume.resources.includes(target.type)
				)
					continue;
				try {
					await target.prepareConsumptionUpdates(this, config, updates);
				} catch (err) {
					if (err instanceof ConsumptionError) {
						errors.push(err);
						ui.notifications.error(err.message, { console: false });
					} else {
						throw err;
					}
				}
			}
		}

		if ((config.consume === true || config.consume.spellSlot) && this.isSpell) {
			const slot = config.spell?.slot ?? `circle-${this.item.system.circle?.value ?? this.item.system.circle?.base}`;
			const slotData = this.actor.system.spellcasting?.slots[slot];
			if (slotData?.value) {
				updates.actor[`system.spellcasting.slots.${slot}.spent`] = slotData.spent + 1;
			} else {
				const err = new ConsumptionError(
					game.i18n.format("BF.Spellcasting.Warning.NoLeveledSlot", { circle: slotData.label })
				);
				errors.push(err);
				ui.notifications.error(err.message, { console: false });
			}
		}

		return errors.length ? false : updates;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine if the configuration dialog is required based on the configuration options. Does not guarantee a dialog
	 * is shown if the dialog is suppressed in the activation dialog configuration.
	 * @param {ActivityActivationConfiguration} config
	 * @returns {boolean}
	 * @protected
	 */
	_requiresConfigurationDialog(config) {
		if (config.consume !== false) return true;
		if (config.scaling !== false) return true;
		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for item activation.
	 * @returns {object}
	 * @protected
	 */
	async _activationChatContext() {
		return {
			activity: this,
			item: this.item,
			actor: this.item.actor,
			token: this.item.actor?.token,
			buttons: {},
			tags: Array.from(this.chatTags.entries())
				.map(([key, label]) => ({ key, label }))
				.filter(t => t.label),
			description: await TextEditor.enrichHTML(this.description || this.item.system.description.value, {
				relativeTo: this.description ? this : this.item,
				rollData: this.item.getRollData(),
				secrets: false,
				async: true
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display an activation chat message for this activity.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the created message.
	 * @returns {Promise<BlackFlagChatMessage|ActivityMessageConfiguration>}
	 */
	async createActivationMessage(message = {}) {
		const context = await this._activationChatContext();

		/**
		 * A hook event that fires before an activity activation card contents is rendered.
		 * @function blackFlag.preCreateActivationMessage
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity for which the card will be created.
		 * @param {ActivityMessageConfiguration} message - Configuration info for the created message.
		 * @param {object} context - Context that will be used to render the message.
		 */
		if (Hooks.call("blackFlag.preCreateActivationMessage", this, message, context) === false) return message;

		const messageConfig = foundry.utils.mergeObject(
			{
				rollMode: game.settings.get("core", "rollMode"),
				data: {
					style: CONST.CHAT_MESSAGE_STYLES.OTHER,
					content: await renderTemplate(message.template ?? this.metadata.usage.chatCard, context),
					speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
					flags: {
						core: { canPopout: true },
						[game.system.id]: {
							type: "activity",
							step: "activation",
							activityType: this.type,
							activityUuid: this.uuid
						}
					}
				}
			},
			message
		);
		ChatMessage.applyRollMode(messageConfig.data, messageConfig.rollMode);

		/**
		 * A hook event that fires before an activity activation card is created.
		 * @function blackFlag.createActivationMessage
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity for which the card will be created.
		 * @param {ActivityMessageConfiguration} message - Configuration info for the created message.
		 */
		if (Hooks.call("blackFlag.createActivationMessage", this, messageConfig) === false) return message;

		const card = messageConfig.create !== false ? await ChatMessage.create(messageConfig.data) : messageConfig;

		/**
		 * A hook event that fires after an activity activation card is created.
		 * @function blackFlag.postCreateActivationMessage
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity for which the card was created.
		 * @param {BlackFlagChatMessage} message - Created chat message.
		 */
		if (messageConfig.create !== false) Hooks.callAll("blackFlag.postCreateActivationMessage", this, messageConfig);

		return card;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any final steps of the activation including creating measured templates.
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activation.
	 * @param {ActivityUsageResults} results - Final details on the activation.
	 * @protected
	 */
	async _finalizeActivation(config, results) {
		// TODO: Create measured templates
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Activate listeners on a chat message.
	 * @param {ChatMessage} message - Associated chat message.
	 * @param {HTMLElement} html - Element in the chat log.
	 */
	activateChatListeners(message, html) {
		for (const element of html.querySelectorAll("[data-action]")) {
			element.addEventListener("click", event => this._onChatAction(event, message));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle an action activated on an activity's chat message.
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {ChatMessage} message - Message associated with the activation.
	 * @returns {Promise}
	 */
	async _onChatAction(event, message) {
		const scaling = message.getFlag(game.system.id, "scaling") ?? 0;
		let item = this.item;
		if (scaling) {
			const updates = { [`flags.${game.system.id}.scaling`]: scaling };
			if (item.type === "spell") {
				updates["system.circle.value"] = (item.system.circle.value ?? item.system.circle.base) + scaling;
			}
			item = item.clone(updates, { keepId: true });
		}
		const activity = item.system.activities.get(this.id);

		const { action, ...properties } = event.target.dataset;
		switch (action) {
			case "roll":
				const method = properties.method;
				if (foundry.utils.getType(activity[method]) !== "function") return;
				return activity[method]();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve a list of targets based on selected tokens.
	 * @returns {BlackFlagActor[]}
	 */
	getActionTargets() {
		let targets = canvas.tokens.controlled.filter(t => t.actor);
		if (!targets.length && game.user.character) targets = game.user.character.getActiveTokens();
		if (!targets.length) ui.notifications.warn("BF.Activity.Core.Warning.NoTargets", { localize: true });
		// TODO: Alternatively fetch targeted tokens
		return targets;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Important information on a targeted token.
	 *
	 * @typedef {object} TargetDescriptor
	 * @property {string} uuid - The UUID of the target.
	 * @property {string} img - The target's image.
	 * @property {string} name - The target's name.
	 * @property {number} [ac] - The target's armor class, if applicable.
	 */

	/**
	 * Grab the targeted tokens and return relevant information on them.
	 * @returns {TargetDescriptor[]}
	 */
	static getTargetDescriptors() {
		const targets = new Map();
		for (const token of game.user.targets) {
			const { name } = token;
			const { img, system, uuid } = token.actor ?? {};
			if (uuid) targets.set(uuid, { name, img, uuid, ac: system?.attributes?.ac?.value });
		}
		return Array.from(targets.values());
	}
}
