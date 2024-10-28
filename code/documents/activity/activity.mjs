import ActivityActivationDialog from "../../applications/activity/activity-activation-dialog.mjs";
import AbilityTemplate from "../../canvas/ability-template.mjs";
import BaseActivity from "../../data/activity/base-activity.mjs";
import { ConsumptionError } from "../../data/activity/fields/consumption-targets-field.mjs";
import {
	areKeysPressed,
	buildRoll,
	getTargetDescriptors,
	localizeSchema,
	numberFormat,
	simplifyFormula
} from "../../utils/_module.mjs";
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
	 * @property {Record<string, Function>} usage.actions - Actions that can be triggered from the chat card.
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
				title: "BF.ACTIVITY.Label[one]",
				hint: "",
				usage: {
					actions: {
						placeTemplate: Activity.#placeTemplate
					},
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
		if (this.metadata.dataModel) this.metadata.dataModel.localize();
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
		localizeSchema(schema, prefixes);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The primary ability for this activity that will be available as `@mod` in roll data.
	 * @type {string|null}
	 */
	get ability() {
		return this.system.ability ?? null;
	}

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
		return `BF.ACTIVITY.Core.Action.${this.isSpell ? "Cast" : "Use"}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is scaling possible with this activity?
	 * @type {boolean}
	 */
	get canScale() {
		return (
			this.consumption.scale.allowed ||
			(this.isSpell &&
				this.item.system.circle.base > 0 &&
				CONFIG.BlackFlag.spellPreparationModes[this.item.getFlag(game.system.id, "relationship.mode")]?.scalable)
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can damage be scaled for this activity? Requires either "Allow Scaling" to be checked or to be on a spell.
	 * @type {boolean}
	 */
	get canScaleDamage() {
		return this.consumption.scale.allowed || this.isSpell;
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
	 * Description used in chat message flavor for messages created with `rollDamage`.
	 * @type {string}
	 */
	get damageFlavor() {
		return game.i18n.localize("BF.DAMAGE.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Damage modifier with any adjustments applied.
	 * @type {number}
	 */
	get damageModifier() {
		const ability = this.actor?.system.abilities?.[this.ability];
		if (!ability) return 0;
		return ability?.adjustedMod ?? ability?.mod;
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
		if (!this.hasDamage) return "";
		const layout = document.createElement("div");
		layout.classList.add("layout");
		const rollConfig = this.getDamageConfig();
		for (const roll of rollConfig.rolls) {
			let formula = roll.parts.join(" + ");
			formula = Roll.defaultImplementation.replaceFormulaData(formula, roll.data);
			formula = simplifyFormula(formula);
			if (formula) {
				const damageType = CONFIG.BlackFlag.damageTypes[roll.options.damageType];
				layout.innerHTML += `<span class="damage">${formula} ${game.i18n.localize(damageType?.label ?? "")}</span>`;
			}
		}
		return layout.outerHTML;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Are any damage parts actually configured for this activity?
	 * @type {boolean}
	 */
	get hasDamage() {
		return this.system.damage?.parts?.length > 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this activity on a spell item, or something else?
	 * @type {boolean}
	 */
	get isSpell() {
		return this.system.isSpell;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Data used to display the activity in the inventory or activity selection lists.
	 * @type {object}
	 */
	get listContext() {
		// TODO: Uses / Activation / Range / Target / Traits (for spells)
		// TODO: Uses / Traits (for inventory)
		// TODO: Uses (for features)
		return { id: this.id, name: this.name, img: this.img, svgImg: this.img.endsWith(".svg") };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create the data added to messages flags.
	 * @type {object}
	 */
	get messageFlags() {
		return {
			activity: { type: this.type, id: this.id, uuid: this.uuid },
			item: { type: this.item.type, id: this.item.id, uuid: this.item.uuid },
			targets: getTargetDescriptors()
		};
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
			class: this.item.system.associatedClass?.identifier,
			item: this.item.getRollData()?.item
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does activating this activity consume a spell slot?
	 * @type {boolean}
	 */
	get spellSlotConsumption() {
		return this.spellSlotScaling && this.item.system.requiresSpellSlot && this.activation.primary;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can a spell slot be selected when activating this activity?
	 * @type {boolean}
	 */
	get spellSlotScaling() {
		if (!this.isSpell || !this.actor?.system.spellcasting?.slots) return false;
		return this.canScale;
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
	 * Consumption targets that can be use for this activity.
	 * @type {Set<string>}
	 */
	get validConsumptionTypes() {
		const types = new Set(Object.keys(CONFIG.BlackFlag.consumptionTypes));
		if (this.isSpell) types.delete("spellSlots");
		return types;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareData() {
		this.name = this.name || game.i18n.localize(this.constructor.metadata.title);
		this.img = this.img || this.constructor.metadata.icon;
		this.system.prepareData?.();
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
	 * @property {object|false} create
	 * @property {boolean} create.measuredTemplate - Should measured templates defined by activity be created?
	 * @property {boolean|object} consume - Consumption configuration, set to `false` to prevent all consumption.
	 * @property {boolean} consume.action - Control whether a part of the action economy is used during activation.
	 * @property {boolean|BlackFlagItem} consume.ammunition - Control whether ammunition is consumed by a weapon or
	 *                                                        provide an ammunition item to consume.
	 * @property {boolean|number[]} consume.resources - Set to `true` or `false` to enable or disable all resource
	 *                                                  consumption or provide a list of consumption indexes to only
	 *                                                  enable those types.
	 * @property {boolean} consume.spellSlot - Control whether spell consumes a spell slot.
	 * @property {Event} [event] - Triggering event.
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
	 * @property {MeasuredTemplateDocument[]} templates - Created measured templates.
	 * @property {ActivationUpdates} updates - Updates to the actor & items.
	 */

	/**
	 * Activate this activity.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivityDialogConfiguration} dialog - Configuration info for the configuration dialog.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the chat message created.
	 */
	async activate(config = {}, dialog = {}, message = {}) {
		if (!this.item.isEmbedded || !this.item.isOwner || this.item.pack) return;

		let item = this.item.clone({}, { keepId: true });
		let activity = item.system.activities.get(this.id);

		const activationConfig = activity._prepareActivationConfig(config);

		const dialogConfig = foundry.utils.mergeObject(
			{
				applicationClass: this.metadata.usage.dialog
			},
			dialog
		);

		const messageConfig = foundry.utils.mergeObject(
			{
				create: true,
				data: {
					flags: {
						[game.system.id]: {
							...this.messageFlags,
							messageType: "activation",
							activation: {
								effects: this.system.applicableEffects?.map(e => e.id)
							}
						}
					}
				},
				template: this.metadata.usage.chatCard
			},
			message
		);

		this._applyKeybindings(activationConfig, dialogConfig, messageConfig);

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
		if (Hooks.call("blackFlag.preActivateActivity", activity, activationConfig, messageConfig, dialogConfig) === false)
			return;

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
		const results = { templates: [], updates };

		// TODO: Create activated effect/track concentration

		// Display the card in chat
		messageConfig.data.rolls = (messageConfig.data.rolls ?? []).concat(updates.rolls);
		if (config.targets?.length) {
			foundry.utils.setProperty(messageConfig, `data.flags.${game.system.id}.targets`, config.targets);
		}
		results.message = await activity.createActivationMessage(messageConfig);

		// Finalize the activation
		await activity._finalizeActivation(activationConfig, results);

		/**
		 * A hook event that fires when an activity is activated.
		 * @function blackFlag.postActivateActivity
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityActivationResults} results - Results of the activation.
		 */
		if (Hooks.call("blackFlag.postActivateActivity", activity, activationConfig, results) === false) return;

		// Trigger any primary action provided by this activity
		activity._triggerSubsequentActions(activationConfig, results);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Consume this activity's usage.
	 * @param {ActivityActivationConfiguration} activationConfig - Any configuration data provided manually.
	 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the chat message.
	 * @returns {ActivationUpdates|false}
	 */
	async consume(activationConfig, messageConfig) {
		/**
		 * A hook event that fires before an item's resource consumption is calculated.
		 * @function blackFlag.preActivityConsumption
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity being activated.
		 * @param {ActivityActivationConfiguration} activationConfig - Configuration data for the activation.
		 * @param {ActivityMessageConfiguration} messageConfig - Configuration data for the activity message to be created.
		 * @returns {boolean} - Explicitly return `false` to prevent activity from being activated.
		 */
		if (Hooks.call("blackFlag.preActivityConsumption", this, activationConfig, messageConfig) === false) return false;

		// Calculate what resources should be consumed
		const updates = await this._prepareActivationUpdates(activationConfig);
		if (updates === false) return false;

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
	 * Apply any keybindings that might affect activation process.
	 * @param {ActivityActivationConfiguration} config - Configuration info for the activation.
	 * @param {ActivityDialogConfiguration} dialog - Configuration info for the configuration dialog.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the chat message created.
	 */
	_applyKeybindings(config, dialog, message) {
		dialog.configure ??=
			!areKeysPressed(config.event, "skipDialogNormal") &&
			!areKeysPressed(config.event, "skipDialogAdvantage") &&
			!areKeysPressed(config.event, "skipDialogDisadvantage");
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

		if (config.create !== false) {
			config.create ??= {};
			config.create.measuredTemplate ??= this.target.template.type && this.target.prompt;
		}

		if (config.consume !== false) {
			config.consume ??= {};
			config.consume.action ??= this.activation.type === "legendary";
			config.consume.resources ??= this.consumption.targets.length > 0;
			config.consume.spellSlot ??= this.spellSlotConsumption;
		}

		if (this.canScale) config.scaling ??= 0;
		else config.scaling = false;

		// If all entries within `config.consume` are `false`, replace object with `false`
		if (config.consume !== false) {
			const anyConsumption = Object.values(config.consume).some(v => v);
			if (!anyConsumption) config.consume = false;
		}

		config.targets ??= getTargetDescriptors();

		// TODO: Begin concentration

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

		if (activationConfig.scaling !== undefined) {
			scaleUpdate[`flags.${game.system.id}.scaling`] = activationConfig.scaling;
			foundry.utils.setProperty(messageConfig.data, `flags.${game.system.id}.scaling`, activationConfig.scaling);
			item.updateSource(scaleUpdate);
			item.system.prepareFinalData?.();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update data produced by activity activation.
	 *
	 * @typedef {object} ActivationUpdates
	 * @property {object} activity - Updates applied to activity that performed the activation.
	 * @property {object} actor - Updates applied to the actor that performed the activation.
	 * @property {object[]} item - Updates applied to items on the actor that performed the activation.
	 * @property {Roll[]} rolls - Any rolls performed as part of the activation.
	 */

	/**
	 * Calculate changes to actor, items, & this activity based on resource consumption.
	 * @param {ActivityActivationConfiguration} config - Activation configuration.
	 * @returns {ActivationUpdates|false}
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

		if (config.consume === true || config.consume.resources) {
			const indexes =
				config.consume === true || config.consume.resources === true
					? this.consumption.targets.keys()
					: config.consume.resources;
			for (const index of indexes) {
				const target = this.consumption.targets[index];
				try {
					await target.consume(config, updates);
				} catch (err) {
					if (err instanceof ConsumptionError) errors.push(err);
					else throw err;
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
					game.i18n.format("BF.Spellcasting.Warning.NoLeveledSlot", {
						circle: slotData.label,
						circleLowercase: slotData.label?.toLowerCase()
					})
				);
				errors.push(err);
				ui.notifications.error(err.message, { console: false });
			}
		}

		// TODO: Validate concentration

		errors.forEach(err => ui.notifications.error(err.message, { console: false }));
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
		const checkObject = obj => foundry.utils.getType(obj) === "Object" && Object.values(obj).some(v => v);
		return checkObject(config.create) || checkObject(config.consume) || config.scaling !== false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the context for item activation.
	 * @returns {object}
	 * @protected
	 */
	async _activationChatContext() {
		const buttons = this._activationChatButtons();
		return {
			activity: this,
			item: this.item,
			actor: this.item.actor,
			token: this.item.actor?.token,
			buttons: buttons.length ? buttons : null,
			subtitle: this.name,
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
	 * @typedef {object} ActivityActivationChatButton
	 * @property {string} label    Label to display on the button.
	 * @property {string} icon     Icon to display on the button.
	 * @property {string} classes  Classes for the button.
	 * @property {object} dataset  Data attributes attached to the button.
	 */

	/**
	 * Create the buttons that will be displayed in chat.
	 * @returns {ActivityActivationChatButton[]}
	 * @protected
	 */
	_activationChatButtons() {
		const buttons = [];

		if (this.target?.template?.type)
			buttons.push({
				label: game.i18n.localize("BF.TARGET.Action.PlaceTemplate"),
				icon: '<i class="fa-solid fa-bullseye" inert></i>',
				dataset: {
					action: "placeTemplate"
				}
			});

		return buttons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine whether the provided button in a chat message should be visible.
	 * @param {HTMLButtonElement} button - The button to check.
	 * @param {BlackFlagChatMessage} message - Chat message containing the button.
	 * @returns {boolean}
	 */
	shouldHideChatButton(button, message) {
		switch (button.dataset.action) {
			case "placeTemplate":
				return !game.user.can("TEMPLATE_CREATE") || !game.canvas.scene;
		}
		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display an activation chat message for this activity.
	 * @param {ActivityMessageConfiguration} message - Configuration info for the created message.
	 * @returns {Promise<BlackFlagChatMessage|ActivityMessageConfiguration>}
	 */
	async createActivationMessage(message = {}) {
		const context = await this._activationChatContext();
		await this.item.system.prepareActivationChatContext?.(context);

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
					content: await renderTemplate(message.template ?? this.metadata.usage.chatCard, context),
					speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
					flags: {
						core: { canPopout: true }
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
	 * @param {ActivityActivationResults} results - Final details on the activation.
	 * @protected
	 */
	async _finalizeActivation(config, results) {
		results.templates = config.create?.measuredTemplate ? await Activity.#placeTemplate.call(this) : [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Trigger a primary activation action defined by the activity (such as opening the attack dialog for attack rolls).
	 * @param {ActivityActivationConfiguration} config - Configuration data for the activation.
	 * @param {ActivityActivationResults} results - Final details on the activation.
	 * @protected
	 */
	async _triggerSubsequentActions(config, results) {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Rolls                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform a damage roll.
	 * @param {Partial<DamageRollProcessConfiguration>} [config] - Configuration information for the roll.
	 * @param {Partial<BasicRollDialogConfiguration>} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {Partial<BasicRollMessageConfiguration>} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<DamageRoll[]|void>}
	 */
	async rollDamage(config = {}, dialog = {}, message = {}) {
		if (!this.item.isEmbedded || this.item.pack) return;

		const rollConfig = this.getDamageConfig(config);
		rollConfig.subject = this;

		const allModifiers = rollConfig.rolls?.map(c => c.modifierData) ?? [];
		const dialogConfig = foundry.utils.mergeObject({
			options: {
				rollNotes: this.actor?.system.getModifiers?.(allModifiers, "note"),
				title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type: this.name })
			}
		});

		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					flags: {
						[game.system.id]: {
							...this.messageFlags,
							messageType: "roll",
							roll: { type: "damage" }
						}
					},
					flavor: `${this.name} - ${this.damageFlavor}`,
					speaker: ChatMessage.getSpeaker({ actor: this.item.actor })
				}
			},
			message
		);

		/**
		 * A hook event that fires before damage is rolled.
		 * @function blackFlag.preRollDamage
		 * @memberof hookEvents
		 * @param {DamageRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return false to prevent the roll from being performed.
		 */
		if (Hooks.call("blackFlag.preRollDamage", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.DamageRoll.build(rollConfig, dialogConfig, messageConfig);
		if (!rolls) return;

		const lastDamageTypes = rolls.reduce((obj, roll, index) => {
			obj[index] = roll.options.damageType;
			return obj;
		}, {});
		if (!foundry.utils.isEmpty(lastDamageTypes)) {
			await this.item.setFlag(game.system.id, `relationship.last.${this.id}.damageType`, lastDamageTypes);
		}

		/**
		 * A hook event that fires after damage has been rolled.
		 * @function blackFlag.postRollDamage
		 * @memberof hookEvents
		 * @param {DamageRoll[]} rolls - The resulting rolls.
		 * @param {object} [data]
		 * @param {Activity} [data.subject] - Activity for which the roll was performed.
		 */
		Hooks.callAll("blackFlag.postRollDamage", rolls, { subject: this });

		return rolls;
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
		html.addEventListener("click", event => {
			const target = event.target.closest("[data-action]");
			if (target) this.#onChatAction(event, target, message);
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle an action activated from an activity's chat message.
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	async #onChatAction(event, target, message) {
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

		const action = target.dataset.action;
		const handler = this.metadata.usage?.actions?.[action];
		target.disabled = true;
		try {
			if (handler) await handler.call(activity, event, target, message);
			else await activity._onChatAction(event, target, message);
		} catch (err) {
			Hooks.onError("Activity#onChatAction", err, { log: "error", notify: "error" });
		} finally {
			target.disabled = false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle an action activated from an activity's chat message. Action handlers in metadata are called first.
	 * This method is only called for actions which have no defined handler.
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 * @protected
	 */
	async _onChatAction(event, target, message) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle placing measured templates into the scene.
	 * @this {Activity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 * @returns {Promise<MeasuredTemplateDocument[]>}
	 */
	static async #placeTemplate(event, target, message) {
		const templates = [];
		try {
			for (const template of AbilityTemplate.fromActivity(this)) {
				const result = await template.drawPreview();
				if (result) templates.push(result);
			}
		} catch (err) {
			Hooks.onError("Activity#placeTemplate", err, {
				msg: game.i18n.localize("BF.TARGET.Warning.PlaceTemplate"),
				log: "error",
				notify: "error"
			});
		}
		return templates;
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
		if (!targets.length) ui.notifications.warn("BF.ACTIVITY.Core.Warning.NoTargets", { localize: true });
		// TODO: Alternatively fetch targeted tokens
		return targets;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the roll parts used to create the damage rolls.
	 * @param {Partial<DamageRollProcessConfiguration>} [config={}]
	 * @returns {DamageRollProcessConfiguration}
	 */
	getDamageConfig(config = {}) {
		if (!this.system.damage?.parts) return foundry.utils.mergeObject({ rolls: [] }, config);

		const rollConfig = foundry.utils.mergeObject({ scaling: 0 }, config);
		const rollData = this.getRollData();
		rollConfig.rolls = this.system.damage.parts
			.map((d, index) => this._processDamagePart(d, rollConfig, rollData, { index }))
			.filter(d => d.parts.length)
			.concat(config.rolls ?? []);

		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Damage formulas and activity.
	 * @param {object} [options={}] - Additional options that might affect fetched data.
	 * @returns {{ activity: Activity, rolls: DamageRollConfiguration[] }|null}
	 */
	getDamageDetails(options = {}) {
		return {
			activity: this,
			rolls: this.getDamageConfig({ attackMode: options.attackMode ?? (options.versatile ? "versatile" : null) }).rolls
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Process a single damage part into a roll configuration.
	 * @param {DamageData} damage - Damage to prepare for the roll.
	 * @param {Partial<DamageRollProcessConfiguration>} rollConfig - Roll configuration being built.
	 * @param {object} rollData - Roll data to populate with damage data.
	 * @param {object} [config={}]
	 * @param {object} [config.modifierData={}] - Extra data to be included in the modifier data.
	 * @param {number} [config.index=0] - Index of the damage part being prepared.
	 * @returns {DamageRollConfiguration}
	 * @protected
	 */
	_processDamagePart(damage, rollConfig, rollData, { modifierData = {}, index = 0 } = {}) {
		modifierData = foundry.utils.mergeObject({ ...this.modifierData, type: "damage", damage }, modifierData);
		const { parts, data } = buildRoll(
			{
				bonus: this.actor?.system.buildBonus?.(this.actor?.system.getModifiers?.(modifierData), { rollData })
			},
			rollData
		);
		const scaledFormula = damage.scaledFormula(rollData.scaling);
		if (scaledFormula) parts.unshift(scaledFormula);

		return {
			data,
			modifierData,
			parts,
			options: {
				damageType:
					damage.type === "variable"
						? this.item.getFlag(game.system.id, `relationship.last.${this.id}.damageType.${index}`)
						: damage.type,
				damageTypes: damage.type === "variable" ? damage.additionalTypes : undefined,
				magical: this.magical,
				minimum: this.actor?.system.buildMinimum?.(this.actor?.system.getModifiers?.(modifierData, "min"), { rollData })
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve the roll data for this activity.
	 * @param {object} [options={}]
	 * @returns {object}
	 */
	getRollData(options = {}) {
		const rollData = this.item.getRollData(options);
		const ability = this.actor?.system.abilities?.[this.ability] ?? {};
		rollData.mod = ability.adjustedMod ?? ability.mod ?? 0;
		return rollData;
	}
}
