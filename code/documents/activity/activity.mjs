import BaseActivity from "../../data/activity/base-activity.mjs";
import PseudoDocumentMixin from "../pseudo-document.mjs";

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
	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		icon: "",
		title: "BF.Activity.Label[one]",
		hint: ""
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The action type that is used to activate this activity.
	 * @type {string}
	 */
	get actionType() {
		return "action";
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
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data for the Advancement.
	 */
	prepareData() {
		this.name = this.name || game.i18n.localize(this.constructor.metadata.title);
		this.img = this.img || this.constructor.metadata.icon;
		this.system.prepareData?.();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration data for an activity's activation.
	 *
	 * @typedef {object} ActivityActivationConfiguration
	 * @property {boolean|object} consume - Consumption configuration, set to `false` to prevent all consumption.
	 * @property {boolean|BlackFlagItem} consume.ammunition - Control whether ammunition is consumed by a weapon or
	 *                                                        provide an ammunition item to consume.
	 * @property {boolean|string[]} consume.resources - Set to `true` or `false` to enable or disable all resource
	 *                                                  consumption or provide a list of consumption type keys defined
	 *                                                  in `CONFIG.BlackFlag.consumptionTypes` to only enable those types.
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
	 */

	/**
	 * Activate this activity.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the chat message created.
	 * @param {object} dialog - Configuration info for the configuration dialog.
	 */
	async activate(config={}, message={}, dialog={}) {
		// Prepare initial activation configuration
		const activationConfig = foundry.utils.mergeObject({
			consume: true
		}, config);

		const messageConfig = foundry.utils.mergeObject({
			create: true,
			data: {
				"flags.black-flag.activity": {
					type: this.metadata.type,
					uuid: this.uuid
				}
			}
		}, message);

		const dialogConfig = foundry.utils.mergeObject({
			configure: true // TODO: Automatically set based on whether item needs configuration
		}, dialog);

		// Call preActivate script & hooks
		// TODO

		// Display configuration window if necessary, wait for result
		// TODO

		// Call preConsumeUses script & hooks
		// TODO

		// Calculate what resources should be consumed
		const updates = this.activationUpdates(activationConfig);
		// TODO: Handle errors

		// Call consumeUses script & hooks
		// TODO

		// Merge activity changes into the item updates
		if ( !foundry.utils.isEmpty(updates.activity) ) {
			const itemIndex = updates.item.findIndex(i => i._id === this.item.id);
			const keyPath = `system.activities.${this.id}`;
			const activityUpdates = foundry.utils.expandObject(updates.activity);
			if ( itemIndex === -1 ) updates.item.push({ _id: this.item.id, [keyPath]: activityUpdates });
			else updates.item[itemIndex][keyPath] = activityUpdates;
		}

		// Update documents with consumption
		if ( !foundry.utils.isEmpty(updates.actor) ) await this.actor.update(updates.actor);
		if ( !foundry.utils.isEmpty(updates.item) ) await this.actor.updateEmbeddedDocuments("Item", updates.item);

		// Call postConsumeUses script & hooks
		// TODO

		// Display the card in chat
		await this.createActivationMessage(message);

		// Create measured templates if necessary
		// TODO

		// Call postActivate script & hooks
		// TODO
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate changes to actor, items, & this activity based on resource consumption.
	 * @param {ActivityActivationConfiguration} config - Activation configuration.
	 * @returns {{activity: object, item: object[], actor: object}}
	 */
	activationUpdates(config) {
		const updates = { activity: {}, item: [], actor: {} };
		if ( !config.consume ) return updates;

		if ( (config.consume === true) || config.consume.ammunition ) {
			// TODO: Let `WeaponData` to handle this
		}

		if ( (config.consume === true) || config.consume.resources ) {
			for ( const target of this.consumption.targets ) {
				if ( (foundry.utils.getType(config.consume.resources) === "Array")
					&& !config.consume.resources.includes(target.type) ) continue;
				target.prepareConsumptionUpdates(this, config, updates);
			}
		}

		return updates;
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
	async createActivationMessage(message={}) {
		const context = await this.activationChatContext();
		const messageConfig = foundry.utils.mergeObject({
			rollMode: game.settings.get("core", "rollMode"),
			data: {
				title: "chat message",
				type: CONST.CHAT_MESSAGE_TYPES.OTHER,
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
		}, message);

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
		for ( const element of html.querySelectorAll("[data-action]") ) {
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
		switch ( action ) {
			case "roll":
				const method = properties.method;
				if ( foundry.utils.getType(this[method]) !== "function" ) return;
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
		if ( !targets.length && game.user.character ) targets = game.user.character.getActiveTokens();
		if ( !targets.length ) ui.notifications.warn("BF.Activity.Core.Warning.NoTargets", {localize: true});
		// TODO: Alternatively fetch targeted tokens
		return targets;
	}
}
