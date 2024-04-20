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
				hint: ""
			},
			{ inplace: false }
		)
	);

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
		return { activity: this.system, item: this.item.getRollData() };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does activating this activity consume a spell slot?
	 * @type {boolean}
	 */
	get requiresSpellSlot() {
		if (!this.isSpell) return false;
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
	 * @property {number} spell.ring - Spell ring to consume. Will take priority over `scaling` on property for spells.
	 */

	/**
	 * Message configuration data used when creating messages.
	 *
	 * @typedef {object} ActivityMessageConfiguration
	 * @property {boolean} [create=true] - Should a message be created when this roll is complete?
	 * @property {object} [data={}] - Additional data used when creating the message.
	 */

	/**
	 * Data for the activity activation configuration dialog.
	 *
	 * @typedef {object} ActivityDialogConfiguration
	 * @property {boolean} [configure=true] - Should the activation configuration dialog be displayed?
	 * @property {typeof ActivityActivationDialog} - [applicationClass] - Alternate activation dialog to use.
	 */

	/**
	 * Activate this activity.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {object} dialog - Configuration info for the configuration dialog.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the chat message created.
	 */
	async activate(config = {}, dialog = {}, message = {}) {
		// Prepare initial activation configuration
		const activationConfig = this.prepareActivationConfig(config);

		const dialogConfig = foundry.utils.mergeObject(
			{
				configure: true,
				applicationClass: ActivityActivationDialog
			},
			dialog
		);

		const messageConfig = foundry.utils.mergeObject(
			{
				create: true,
				data: {}
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
		if (Hooks.call("blackFlag.preActivateActivity", this, activationConfig, messageConfig, dialogConfig) === false) {
			return;
		}

		// Display configuration window if necessary, wait for result
		if (dialogConfig.configure && this.requiresConfigurationDialog(activationConfig)) {
			try {
				await dialogConfig.applicationClass.create(this, activationConfig, dialogConfig.options);
			} catch (err) {
				return;
			}
		}

		// TODO: Handle upcasting

		// Call preActivityConsumption script & hooks
		// TODO: preActivityConsumption script
		/**
		 * A hook event that fires before an item's resource consumption is calculated.
		 * @function @blackFlag.preActivityConsumption
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the activity message to be created.
		 * @returns {boolean} - Explicitly return `false` to prevent activity from being activated.
		 */
		if (Hooks.call("blackFlag.preActivityConsumption", this, activationConfig, messageConfig) === false) {
			return;
		}

		// Calculate what resources should be consumed
		const updates = await this.activationUpdates(activationConfig);
		if (updates === false) return;

		// Call activityConsumption script & hooks
		// TODO: activityConsumption script
		/**
		 * A hook event that fires after an item's resource consumption is calculated, but before an updates are performed.
		 * @function @blackFlag.activityConsumption
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the activity message to be created.
		 * @param {ActivationUpdates} updates - Updates that will be applied to the actor and other documents.
		 * @returns {boolean} - Explicitly return `false` to prevent activity from being activated.
		 */
		if (Hooks.call("blackFlag.preActivityConsumption", this, activationConfig, messageConfig, updates) === false) {
			return;
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
		 * @function @blackFlag.postActivityConsumption
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the activity message to be created.
		 * @param {ActivationUpdates} updates - Updates that have been applied to the actor and other documents.
		 * @returns {boolean} - Explicitly return `false` to prevent activity from being activated.
		 */
		if (Hooks.call("blackFlag.preActivityConsumption", this, activationConfig, messageConfig, updates) === false) {
			return;
		}

		// Display the card in chat
		messageConfig.data.rolls = (messageConfig.data.rolls ?? []).concat(updates.rolls);
		const createdMessage = await this.createActivationMessage(messageConfig);

		// Create measured templates if necessary
		// TODO

		// Call postActivate script & hooks
		// TODO: postActivate script
		/**
		 * A hook event that fires when an activity is activated.
		 * @function blackFlag.postActivateActivity
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {BlackFlagChatMessage|ActivityMessageConfiguration} message - The chat message created for the activation,
		 *                                                                      or the message data if create was `false`.
		 * @param {MeasuredTemplateDocument[]|null} templates - Any measured templates that were created.
		 */
		Hooks.callAll("blackFlag.postActivateActivity", this, activationConfig, createdMessage, null);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare activation configuration object with the necessary defaults based on the activity and item.
	 * @param {ActivityActivationConfiguration} [config={}] - Any configuration data provided manually.
	 * @returns {ActivityActivationConfiguration}
	 */
	prepareActivationConfig(config = {}) {
		config = foundry.utils.deepClone(config);

		if (config.consume !== false) {
			config.consume ??= {};
			config.consume.action ??= this.activation.type === "legendary";
			// TODO: consume.ammunition
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

		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine if the configuration dialog is required based on the configuration options. Does not guarantee a dialog
	 * is shown if the dialog is suppressed in the activation dialog configuration.
	 * @param {ActivityActivationConfiguration} config
	 * @returns {boolean}
	 */
	requiresConfigurationDialog(config) {
		if (config.consume !== false) return true;
		if (config.scaling !== false) return true;
		return false;
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
	 */
	async activationUpdates(config) {
		const updates = { activity: {}, item: [], actor: {}, rolls: [] };
		if (!config.consume) return updates;
		const errors = [];

		if ((config.consume === true || config.consume.action) && this.activation.type === "legendary") {
			const count = this.activation.value ?? 1;
			const legendary = this.actor.system.attributes?.legendary;
			if (legendary) {
				let errMessage;
				if (legendary.value === 0) errMessage = "BF.Activation.Warning.NoActions";
				else if (count > legendary.value) errMessage = "BF.Activation.Warning.NotEnoughActions";
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
			const ring = config.spell?.ring ?? this.item.system.ring?.value ?? this.item.system.ring?.base;
			// TODO: Support other spellcasting types
			const ringData = this.actor.system.spellcasting?.rings[`ring-${ring}`];
			if (ringData?.value) {
				updates.actor[`system.spellcasting.rings.ring-${ring}.spent`] = ringData.spent + 1;
			} else {
				const err = new ConsumptionError(
					game.i18n.format("BF.Spellcasting.Warning.NoLeveledSlot", {
						ring: CONFIG.BlackFlag.spellRings()[ring]
					})
				);
				errors.push(err);
				ui.notifications.error(err.message, { console: false });
			}
		}

		return errors.length ? false : updates;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for item activation.
	 * @returns {object}
	 */
	async activationChatContext() {
		const context = {
			activity: this,
			item: this.item,
			actor: this.item.actor,
			token: this.item.actor?.token,
			buttons: {},
			tags: []
		};
		// TODO: Add activity description
		// TODO: Prepare tags
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display an activation chat message for this activity.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the created message.
	 * @returns {Promise<ChatMessage|ActivityMessageConfiguration>}
	 */
	async createActivationMessage(message = {}) {
		const context = await this.activationChatContext();
		const messageConfig = foundry.utils.mergeObject(
			{
				rollMode: game.settings.get("core", "rollMode"),
				data: {
					title: "chat message",
					type: game.release.generation < 12 ? CONST.CHAT_MESSAGE_TYPES.OTHER : undefined,
					style: game.release.generation < 12 ? undefined : CONST.CHAT_MESSAGE_STYLES.OTHER,
					content: await renderTemplate("systems/black-flag/templates/activities/chat/activation-card.hbs", context),
					speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
					flags: {
						core: { canPopout: true },
						"black-flag": {
							type: "activity",
							step: "activation",
							uuid: this.uuid
						}
					}
				}
			},
			message
		);

		// TODO: Call preCreateActivationMessage script & hooks

		ChatMessage.applyRollMode(messageConfig.data, messageConfig.rollMode);

		const card = messageConfig.create !== false ? await ChatMessage.create(messageConfig.data) : messageConfig;

		// TODO: Call postCreateActivationMessage script & hooks

		return card;
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
		const { action, ...properties } = event.target.dataset;
		switch (action) {
			case "roll":
				const method = properties.method;
				if (foundry.utils.getType(this[method]) !== "function") return;
				return this[method]();
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
}
