import EnchantActivationDialog from "../../applications/activity/enchant-activation-dialog.mjs";
import { EnchantData } from "../../data/activity/enchant-data.mjs";
import { getSelectedTokens } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for enchanting items.
 */
export default class EnchantActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "enchant",
				dataModel: EnchantData,
				icon: "systems/black-flag/artwork/activities/enchant.svg",
				title: "BF.ENCHANT.Title",
				hint: "BF.ENCHANT.Hint",
				usage: {
					dialog: EnchantActivationDialog
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of item types that are enchantable.
	 * @type {Set<string>}
	 */
	get enchantableTypes() {
		return Object.entries(CONFIG.Item.dataModels).reduce((set, [k, v]) => {
			if (v.metadata?.hasEffects) set.add(k);
			return set;
		}, new Set());
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Existing enchantment applied by this activity on this activity's item.
	 * @type {BlackFlagActiveEffect}
	 */
	get existingEnchantment() {
		return this.system.autoSelf
			? this.item.effects.find(e => e.isAppliedEnchantment && e.origin === this.uuid)
			: undefined;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_prepareActivationConfig(config) {
		config = super._prepareActivationConfig(config);
		const existingProfile = this.existingEnchantment?.flags[game.system.id]?.enchantmentProfile;
		config.enchantmentProfile ??= this.item.effects.has(existingProfile)
			? existingProfile
			: this.system.applicableEffects[0]?._id;
		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_requiresConfigurationDialog(config) {
		return super._requiresConfigurationDialog(config) || this.system.applicableEffects.length > 1;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_finalizeMessageConfig(activationConfig, messageConfig, results) {
		super._finalizeMessageConfig(activationConfig, messageConfig, results);
		delete messageConfig.data.system?.effects;

		// Store selected enchantment profile in message flag
		if (activationConfig.enchantmentProfile)
			foundry.utils.setProperty(
				messageConfig.data,
				`flags.${game.system.id}.enchantmentProfile`,
				activationConfig.enchantmentProfile
			);

		// Don't display message if just auto-disabling existing enchantment
		if (this.existingEnchantment?.flags[game.system.id]?.enchantmentProfile === activationConfig.enchantmentProfile) {
			messageConfig.create = false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	onRenderChatCard(message, element) {
		const enchantmentProfile = message.getFlag(game.system.id, "enchantmentProfile");
		if (!enchantmentProfile || !message.isContentVisible) return;

		// Create the enchantment tray
		const enchantmentApplication = document.createElement("blackFlag-enchantmentApplication");
		const afterElement = element.querySelector(".card-footer");
		if (afterElement) afterElement.insertAdjacentElement("beforebegin", enchantmentApplication);
		else element.querySelector(".chat-card")?.append(enchantmentApplication);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _triggerSubsequentActions(config, results) {
		if (!this.system.autoSelf) return;

		// If enchantment from this activity already exists, remove it
		const existingEnchantment = this.existingEnchantment;
		if (existingEnchantment) await existingEnchantment?.delete({ chatMessageOrigin: results.message?.id });

		// If no existing enchantment, or existing enchantment profile doesn't match provided one, create new enchantment
		if (
			!existingEnchantment ||
			existingEnchantment.flags[game.system.id]?.enchantmentProfile !== config.enchantmentProfile
		) {
			this.applyEnchantment(config.enchantmentProfile, this.item, { chatMessage: results.message, strict: false });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply an enchantment to the provided item.
	 * @param {string} profileId - ID of the enchantment profile to apply.
	 * @param {BlackFlagItem} item - Item to which to apply the enchantment.
	 * @param {object} [options={}]
	 * @param {BlackFlagChatMessage} [options.chatMessage] - Chat message used to make the enchantment, if applicable.
	 * @param {boolean} [options.strict] - Display UI errors and prevent creation if enchantment isn't allowed.
	 * @returns {Promise<BlackFlagActiveEffect|null>} - Created enchantment effect if the process was successful.
	 */
	async applyEnchantment(profileId, item, { chatMessage, strict = true } = {}) {
		const profile = this.effects.find(p => p._id === profileId);
		const effect = profile?.uuid ? await fromUuid(profile.uuid) : this.item.effects.get(profile._id);
		if (!effect) return null;

		// Validate against the enchantment's restraints on the origin item
		if (strict) {
			const errors = this.canEnchant(item, { chatMessage });
			if (errors?.length) {
				errors.forEach(err => ui.notifications.error(err.message, { console: false }));
				return null;
			}
		}

		const flags = { enchantmentProfile: profile };
		const enchantmentData = effect
			.clone({
				flags: { [game.system.id]: flags },
				origin: this.uuid,
				system: { applied: true }
			})
			.toObject();

		/**
		 * Hook that fires before an enchantment is applied to an item.
		 * @function blackFlag.preApplyEnchantment
		 * @memberof hookEvents
		 * @param {BlackFlagItem} item - Item to which the enchantment will be applied.
		 * @param {object} enchantmentData - Data for the enchantment effect that will be created.
		 * @param {object} options
		 * @param {Activity} options.activity - Enchant activity applied the enchantment.
		 * @param {BlackFlagChatMessage} options.chatMessage - Chat message used to make the enchantment, if applicable.
		 * @returns {boolean} - Explicitly return `false` to prevent enchantment from being applied.
		 */
		if (Hooks.call("blackFlag.preApplyEnchantment", item, enchantmentData, { activity: this, chatMessage }) === false)
			return null;

		// For compendium items, create on actor
		if (item.inCompendium) {
			const actor = this.actor.isOwner ? this.actor : getSceneTargets()[0]?.actor ?? game.user.character;
			if (!actor) {
				ui.notifications.warn("BF.ENCHANT.Warning.NoTargetActor");
				return null;
			}
			enchantmentData._id = foundry.utils.randomID();
			const toCreate = await Item.implementation.createWithContents([item], {
				transformAll: item =>
					item.clone({ [`flags.${game.system.id}.dependentOn`]: `.ActiveEffect.${enchantmentData._id}` })
			});
			[item] = await Item.implementation.createDocuments(toCreate, { keepId: true, parent: actor });
		}

		const enchantment = await ActiveEffect.create(enchantmentData, {
			parent: item,
			keepId: true,
			[game.system.id]: {
				chatMessageOrigin: chatMessage?.id,
				keepOrigin: true
			}
		});

		/**
		 * Hook that fires after an enchantment has been applied to an item.
		 * @function blackFlag.applyEnchantment
		 * @memberof hookEvents
		 * @param {BlackFlagItem} item - Item to which the enchantment was be applied.
		 * @param {BlackFlagActiveEffect} enchantment - The enchantment effect that was be created.
		 * @param {object} options
		 * @param {Activity} options.activity - Enchant activity applied the enchantment.
		 * @param {BlackFlagChatMessage} options.chatMessage - Chat message used to make the enchantment, if applicable.
		 */
		Hooks.callAll("blackFlag.applyEnchantment", item, enchantment, { activity: this, chatMessage });

		return enchantment;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine whether the provided item can be enchanted based on this enchantment's restrictions.
	 * @param {BlackFlagItem} item - Item that might be enchanted.
	 * @param {object} [options={}]
	 * @param {BlackFlagChatMessage} [options.chatMessage] - Chat message used to make the enchantment, if applicable.
	 * @returns {true|EnchantmentError[]}
	 */
	canEnchant(item, { chatMessage } = {}) {
		const errors = [];
		const restrictions = this.system.restrictions;

		if (!this.enchantableTypes.has(item.type)) {
			errors.push(
				new EnchantmentError(
					_loc("BF.ENCHANT.Warning.NotEnchantable", { type: _loc(CONFIG.Item.typeLabels[item.type]) })
				)
			);
		}

		if (!restrictions.allowMagical && item.system.properties?.has("magical") && item.system.isPhysical) {
			errors.push(new EnchantmentError(_loc("BF.ENCHANT.Warning.NoMagicalItems")));
		}

		if (restrictions.type && item.type !== restrictions.type) {
			errors.push(
				new EnchantmentError(
					_loc("BF.ENCHANT.Warning.WrongType", {
						incorrectType: _loc(CONFIG.Item.typeLabels[item.type]),
						allowedType: _loc(CONFIG.Item.typeLabels[restrictions.type])
					})
				)
			);
		}

		if (restrictions.categories.size && !restrictions.categories.has(item.system.type?.category)) {
			const getLabel = key => CONFIG.Item.dataModels[restrictions.type]?.validCategories?.localized?.[key];
			errors.push(
				new EnchantmentError(
					_loc(`BF.ENCHANT.Warning.${item.system.type?.value ? "WrongType" : "NoSubtype"}`, {
						allowedType: game.i18n.getListFormatter({ type: "disjunction" }).format(
							Array.from(restrictions.categories)
								.map(c => getLabel(c)?.toLowerCase())
								.filter(_ => _)
						),
						incorrectType: getLabel(item.system.type?.category)
					})
				)
			);
		}

		if (restrictions.types.size && !restrictions.types.has(item.system.type?.value)) {
			const getLabel = key => CONFIG.Item.dataModels[restrictions.type]?.validTypes?.localized?.[key];
			errors.push(
				new EnchantmentError(
					_loc(`BF.ENCHANT.Warning.${item.system.type?.value ? "WrongType" : "NoSubtype"}`, {
						allowedType: game.i18n.getListFormatter({ type: "disjunction" }).format(
							Array.from(restrictions.types)
								.map(c => getLabel(c)?.toLowerCase())
								.filter(_ => _)
						),
						incorrectType: getLabel(item.system.type?.value)
					})
				)
			);
		}

		if (
			restrictions.properties.size &&
			!restrictions.properties.intersection(item.system.properties ?? new Set()).size
		) {
			errors.push(
				new EnchantmentError(
					_loc("BF.ENCHANT.Warning.MissingProperty", {
						validProperties: game.i18n
							.getListFormatter({ type: "disjunction" })
							.format(Array.from(restrictions.properties).map(p => CONFIG.BlackFlag.itemProperties.localized[p] ?? p))
					})
				)
			);
		}

		/**
		 * A hook event that fires while validating whether an enchantment can be applied to a specific item.
		 * @function blackFlag.canEnchant
		 * @memberof hookEvents
		 * @param {EnchantActivity} activity - The activity performing the enchanting.
		 * @param {BlackFlagItem} item - Item to which the enchantment will be applied.
		 * @param {EnchantmentError[]} errors - List of errors containing failed restrictions. The item will be
		 *                                      enchanted so long as no errors are listed, otherwise the provided
		 *                                      errors will be displayed to the user.
		 * @param {object} options
		 * @param {BlackFlagChatMessage} [options.chatMessage] - Chat message used to make the enchantment, if applicable.
		 */
		Hooks.callAll("blackFlag.canEnchant", this, item, errors, { chatMessage });

		return errors.length ? errors : true;
	}
}

/**
 * Error to throw when an item cannot be enchanted.
 */
export class EnchantmentError extends Error {
	constructor(...args) {
		super(...args);
		this.name = "EnchantmentError";
	}
}
