import SkillRollConfigurationDialog from "../applications/dice/skill-configuration-dialog.mjs";
import ActivationsField from "../data/chat-message/fields/activations-field.mjs";
import ActorDeltasField from "../data/chat-message/fields/deltas-field.mjs";
import { buildRoll, getPluralRules, log, numberFormat, Trait } from "../utils/_module.mjs";
import DocumentMixin from "./mixins/document.mjs";
import NotificationsCollection from "./notifications.mjs";
import Proficiency from "./proficiency.mjs";

export default class BlackFlagActor extends DocumentMixin(Actor) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * An object that tracks which tracks the changes to the data model which were applied by advancement.
	 * @type {object}
	 */
	advancementOverrides = this.advancementOverrides ?? {};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Are advancement changes currently being applied?.
	 * @type {boolean}
	 */
	#advancementProcessing = false;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Internal queue of advancement operations to apply.
	 * @type {{advancement: Advancement, functionName: string, parameters: *[]}[]}
	 */
	#advancementQueue = [];

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this actor currently preparing embedded documents?
	 * @type {boolean}
	 */
	_embeddedPreparation = false;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Collection of notifications that should be displayed on the actor sheet.
	 */
	notifications = this.notifications;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mapping of item source UUIDs to the items.
	 * @type {Map<string, Set<BlackFlagItem>>}
	 */
	sourcedItems = this.sourcedItems;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Creatures summoned by this actor.
	 * @type {BlackFlagActor[]}
	 */
	get summonedCreatures() {
		return BlackFlag.registry.summons.creatures(this);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		this.notifications = new NotificationsCollection();
		super.prepareData();
		this.items.forEach(i => i.system.prepareFinalData?.());
		this.system.prepareNotifications?.();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareEmbeddedDocuments() {
		this.sourcedItems = new Map();
		this._embeddedPreparation = true;
		super.prepareEmbeddedDocuments();
		this._embeddedPreparation = false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		const origin = this.getFlag(game.system.id, "summon.origin");
		if (origin && this.token?.id) BlackFlag.registry.summons.track(origin.split(".Item.")[0], this.uuid);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	*allApplicableEffects() {
		for (const effect of super.allApplicableEffects()) {
			if (effect.type === "enchantment") continue;
			yield effect;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	applyActiveEffects() {
		this.system.prepareEmbeddedData?.();
		this.applyAdvancementEffects();
		return super.applyActiveEffects();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply any transformations to the Actor which are caused by dynamic Advancement.
	 */
	applyAdvancementEffects() {
		const cls = getDocumentClass("ActiveEffect");
		const applier = new cls({ name: "temp" });
		const overrides = {};

		const levels = [
			{ character: 0, class: 0 },
			...Object.values(this.system.progression?.levels ?? {}).map(l => l.levels)
		];
		const applied = new Map();
		for (const level of levels) {
			for (const advancement of this.advancementForLevel(level.character)) {
				advancement
					.changes(level)
					?.map(change => {
						const c = foundry.utils.deepClone(change);
						c.advancement = advancement;
						c.priority ??= c.mode * 10;
						return c;
					})
					.sort((lhs, rhs) => lhs.priority - rhs.priority)
					.forEach(c => {
						// Special handling of override to avoid issue with scale values
						if (c.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE && foundry.utils.getType(c.value) === "Object") {
							foundry.utils.setProperty(this, c.key, c.value);
							overrides[c.key] = c.value;
						} else Object.assign(overrides, applier.apply(this, c));
						if (!applied.has(level)) applied.set(level, []);
						applied.get(level).push(c);
					});
			}
		}
		if (CONFIG.BlackFlag.debug.advancementChanges && applied.size) log("Appling Advancement:", { extras: applied });

		this.advancementOverrides = foundry.utils.expandObject(overrides);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get advancement for the actor.
	 * @param {number} level - Character level for which to get the advancement.
	 * @yields {Advancement}
	 */
	*advancementForLevel(level = 0) {
		const levels = level > 0 ? this.system.progression.levels[level]?.levels : { character: 0, class: 0 };
		if (!levels) return;
		for (const item of this.items) {
			for (const advancement of item.advancementForLevel(levels)) {
				yield advancement;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Description of a source of damage.
	 *
	 * @typedef {object} DamageDescription
	 * @property {number} value - Amount of damage.
	 * @property {string} type - Type of damage.
	 * @property {boolean} magical - Is the damage magical?
	 * @property {object} [active]
	 * @property {number} [active.multiplier] - Final calculated multiplier.
	 * @property {DamageAffectDescription} [active.all] - How did resistances/etc. to all damage affect the total.
	 * @property {DamageAffectDescription} [active.type] - How did resistances/etc. to this damage type affect the total.
	 * @property {BlackFlagActor|BlackFlagItem} [source] - Source of the damage.
	 */

	/**
	 * @typedef {object} DamageAffectDescription
	 * @property {boolean} [threshold] - Did threshold affect this description?
	 * @property {boolean} [modifications] - Did modification affect this description?
	 * @property {boolean} [resistance] - Did resistance affect this description?
	 * @property {boolean} [vulnerability] - Did vulnerability affect this description?
	 * @property {boolean} [immunity] - Did immunity affect this description?
	 */

	/**
	 * Options for damage application.
	 *
	 * @typedef {object} DamageApplicationOptions
	 * @property {boolean|Set<string>} [downgrade] - Should this actor's resistances and immunities be downgraded by one
	 *                                               step? A set of damage types to be downgraded or `true` to downgrade
	 *                                               all damage types.
	 * @property {number} [multiplier=1] - Amount by which to multiply all damage (before damage resistance, etc).
	 * @property {object|boolean} [ignore] - Set to `true` to ignore all damage modifiers. If set to an object, then
	 *                                       values can either be `true` to indicate that the all modifications of that
	 *                                       type should be ignored, or a set of specific damage types for which it should
	 *                                       be ignored.
	 * @property {boolean|Set<string>} [ignore.immunity] - Should this actor's damage immunity be ignored?
	 * @property {boolean|Set<string>} [ignore.modification] - Should this actor's damage modification be ignored?
	 * @property {boolean|Set<string>} [ignore.resistance] - Should this actor's damage resistance be ignored?
	 * @property {boolean} [ignore.threshold] - Should this actor's damage threshold be ignored?
	 * @property {boolean|Set<string>} [ignore.vulnerability] - Should this actor's damage vulnerability be ignored?
	 * @property {boolean} [invertHealing=true] - Automatically invert healing types to it heals, rather than damages.
	 * @property {"damage"|"healing"} [only] - Apply only damage or healing parts. Untyped rolls will always be applied.
	 */

	/**
	 * Apply damage to the actor.
	 * @param {DamageDescription[]|number} damages - Damages to apply.
	 * @param {DamageApplicationOptions} [options={}]
	 * @returns {Promise<BlackFlagActor>} - The actor after the update has been performed.
	 */
	async applyDamage(damages, options = {}) {
		const hp = this.system.attributes.hp;
		if (!hp?.max) return;

		if (Number.isNumeric(damages)) {
			damages = [{ value: damages }];
			options.ignore ??= true;
		}

		damages = this.calculateDamage(damages, options);
		if (!damages) return this;

		// Round damage towards zero
		let { amount, temp, tempMax } = damages.reduce(
			(acc, d) => {
				if (d.type === "temp") acc.temp += d.value;
				else if (d.type === "max") acc.tempMax += d.rollType === "healing" ? -1 * d.value : d.value;
				else acc.amount += d.value;
				return acc;
			},
			{ amount: 0, temp: 0, tempMax: 0 }
		);
		amount = amount > 0 ? Math.floor(amount) : Math.ceil(amount);
		if (tempMax < 0) amount += tempMax;

		// Subtract from temp HP first & then from normal HP
		const deltaTemp = amount > 0 ? Math.min(hp.temp, amount) : 0;
		const deltaHP = Math.clamp(amount - deltaTemp, -hp.damage + tempMax, hp.value - tempMax);
		const updates = {
			"system.attributes.hp.temp": hp.temp - deltaTemp,
			"system.attributes.hp.tempMax": hp.tempMax - tempMax,
			"system.attributes.hp.value": hp.value - deltaHP,
			"system.attributes.hp.damage": hp.damage + deltaHP
		};
		if (temp > updates["system.attributes.hp.temp"]) updates["system.attributes.hp.temp"] = temp;

		/**
		 * A hook event that fires before damage is applied to an actor.
		 * @param {BlackFlagActor} actor - Actor the damage will be applied to.
		 * @param {number} amount - Amount of damage that will be applied.
		 * @param {object} updates - Distinct updates to be performed on the actor.
		 * @param {DamageApplicationOptions} options - Additional damage application options.
		 * @returns {boolean} - Explicitly return `false` to prevent damage application.
		 * @function blackFlag.preApplyDamage
		 * @memberof hookEvents
		 */
		if (Hooks.call("blackFlag.preApplyDamage", this, amount, updates, options) === false) return this;

		// Call core's hook so anything watching token bar changes can respond
		if (
			Hooks.call(
				"modifyTokenAttribute",
				{
					attribute: "attributes.hp",
					value: amount,
					isDelta: false,
					isBar: true
				},
				updates
			) === false
		)
			return false;

		await this.update(updates);

		/**
		 * A hook event that fires after damage has been applied to an actor.
		 * @param {BlackFlagActor} actor - Actor that has been damaged.
		 * @param {number} amount - Amount of damage that has been applied.
		 * @param {DamageApplicationOptions} options - Additional damage application options.
		 * @function blackFlag.postApplyDamage
		 * @memberof hookEvents
		 */
		Hooks.callAll("blackFlag.postApplyDamage", this, amount, options);

		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply temp HP to the actor, but only if it's more than the actor's current temp HP.
	 * @param {number} amount - Amount of temp HP to apply.
	 * @returns {Promise<BlackFlagActor>} - The actor after the update has been performed.
	 */
	async applyTempHP(amount = 0) {
		const hp = this.system.attributes.hp;
		if (!hp) return;
		return amount > hp.temp ? this.update({ "system.attributes.hp.temp": amount }) : this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate the damage that will be applied to this actor.
	 * @param {DamageDescription[]} damages - Damages to calculate.
	 * @param {DamageApplicationOptions} [options={}] - Damage calculation options.
	 * @returns {DamageDescription[]|false} - New damage descriptions with changes applied, or `false` if the calculation
	 *                                        was canceled by a hook.
	 */
	calculateDamage(damages, options = {}) {
		damages = foundry.utils.deepClone(damages);

		/**
		 * A hook event that fires before damage amount is calculated for an actor.
		 * @param {BlackFlagActor} actor - The actor being damaged.
		 * @param {DamageDescription[]} damages - Damage descriptions.
		 * @param {DamageApplicationOptions} options - Additional damage application options.
		 * @returns {boolean} - Explicitly return `false` to prevent damage application.
		 * @function blackFlag.preCalculateDamage
		 * @memberof hookEvents
		 */
		if (Hooks.call("blackFlag.preCalculateDamage", this, damages, options) === false) return false;

		const multiplier = options.multiplier ?? 1;

		const skipped = type => {
			if (options.only === "damage") return type in CONFIG.BlackFlag.healingTypes;
			if (options.only === "healing") return type in CONFIG.BlackFlag.damageTypes;
			return false;
		};

		damages.forEach(d => {
			d.active ??= {};

			// Skip damage types with immunity
			if (skipped(d.type) || this.#changeHasEffect("immunity", d, { options })) {
				d.value = 0;
				d.active.multiplier = 0;
				return;
			}

			// TODO: Apply damage modification

			let damageMultiplier = multiplier;

			// Apply damage resistance
			if (this.#changeHasEffect("resistance", d, { options })) {
				damageMultiplier /= 2;
			}

			// Apply damage vulnerability
			if (this.#changeHasEffect("vulnerability", d, { options })) {
				damageMultiplier *= 2;
			}

			// Negate healing types
			if (options.invertHealing !== false && d.type === "healing") damageMultiplier *= -1;

			d.value = d.value * damageMultiplier;
			d.active.multiplier = (d.active.multiplier ?? 1) * damageMultiplier;
		});

		if (this.system.attributes?.ac?.threshold && options.ignore !== true && options.ignore?.threshold !== true) {
			const total = damages.reduce((t, d) => t + (["temp", "max"].includes(d.type) ? 0 : d.value), 0);
			if (total < this.system.attributes.ac.threshold) {
				for (const damage of damages) {
					if (["temp", "max"].includes(damage.type) || damage.value <= 0) continue;
					damage.value = 0;
					damage.active ??= {};
					damage.active.threshold = true;
				}
			}
		}

		/**
		 * A hook event that fires after damage amount is calculated for an actor.
		 * @param {BlackFlagActor} actor - The actor being damaged.
		 * @param {DamageDescription[]} damages - Damage descriptions.
		 * @param {DamageApplicationOptions} options - Additional damage application options.
		 * @returns {boolean} - Explicitly return `false` to prevent damage application.
		 * @function blackFlag.postCalculateDamage
		 * @memberof hookEvents
		 */
		if (Hooks.call("blackFlag.postCalculateDamage", this, damages, options) === false) return false;

		return damages;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine whether a specific type of change to a damage value will have an effect.
	 * @param {string} category - What type of change should be considered (e.g. resistance, vulnerability, etc.).
	 * @param {DamageDescription|string} damage - Damage description to consider or a specific type.
	 * @param {object} [options={}]
	 * @param {DamageApplicationOptions} [options.options={}] - Damage application options.
	 * @param {boolean} [options.skipDowngrade=false] - Should downgrades be skipped?
	 * @returns {boolean}
	 */
	#changeHasEffect(category, damage, { options = {}, skipDowngrade = false } = {}) {
		const config =
			this.system.traits?.damage?.[
				{
					immunity: "immunities",
					resistance: "resistances",
					vulnerability: "vulnerabilities"
				}[category]
			];
		const downgrade = type => options.downgrade === true || options.downgrade?.has?.(type);
		const setActive = type => {
			if (damage.active) {
				damage.active[type] ??= {};
				damage.active[type][category] = true;
			}
			return true;
		};
		const type = foundry.utils.getType(damage) === "string" ? damage : damage.type;

		// If category is resistance, check for downgraded immunities
		if (category === "resistance") {
			if (downgrade("all") && this.#changeHasEffect("immunity", "all", { skipDowngrade: true })) {
				return setActive("all");
			}
			if (downgrade(type) && this.#changeHasEffect("immunity", type, { skipDowngrade: true })) {
				return setActive("type");
			}
		}

		// If all damage resistance is present and not ignored
		if (
			!this.#changeIsIgnored(category, "all", { options, skipDowngrade }) &&
			(config?.value.has("all") || (config?.nonmagical.has("all") && !damage.magical))
		) {
			return setActive("all");
		}

		// If specific type damage resistance is present and not ignored
		if (
			!this.#changeIsIgnored(category, type, { options, skipDowngrade }) &&
			(config?.value.has(type) || (config?.nonmagical.has(type) && !damage.magical))
		) {
			return setActive("type");
		}

		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine whether a specific damage change type should be ignored.
	 * @param {string} category - What type of change should be considered (e.g. resistance, vulnerability, etc.).
	 * @param {string} type - Specific damage type to consider.
	 * @param {object} [options={}]
	 * @param {DamageApplicationOptions} [options.options={}] - Damage application options.
	 * @param {boolean} [options.skipDowngrade=false] - Should downgrades not be taken into account?
	 * @returns {boolean}
	 */
	#changeIsIgnored(category, type, { options = {}, skipDowngrade = false } = {}) {
		const downgrade = type => options.downgrade === true || options.downgrade?.has?.(type);

		// All categories are ignored
		if (options.ignore === true) return true;

		// Specific category is ignored, or specific category has this type in its ignore list
		if (options.ignore?.[category] === true || options.ignore?.[category]?.has?.(type)) return true;

		// When downgrading, always ignore immunities unless `skipDowngrade` option is set
		if (category === "immunity" && downgrade(type) && !skipDowngrade) return true;

		// When downgrading, resistances should be decided by whether immunity is applied
		if (category === "resistance" && downgrade(type) && !this.#changeHasEffect("immunity", type)) return true;

		return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add an advancement change to the application queue. Will automatically start processing advancements if
	 * processing is not currently ongoing.
	 * @param {Advancement} advancement - Advancement upon which the function will be called.
	 * @param {string} functionName - Name of the function to call.
	 * @param {*[]} parameters - Parameters that should be called on the function.
	 */
	enqueueAdvancementChange(advancement, functionName, parameters) {
		this.#advancementQueue.push({ advancement, functionName, parameters });
		if (!this.#advancementProcessing) this.#processAdvancementChanges();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getRollData(options = {}) {
		let rollData;
		if (this.system.getRollData) rollData = this.system.getRollData(options);
		else rollData = { ...super.getRollData() };
		rollData.flags = { ...this.flags };
		rollData.name = this.name;
		return rollData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async modifyTokenAttribute(attribute, value, isDelta, isBar) {
		if (["attributes.hp", "attributes.hp.value"].includes(attribute)) {
			const hp = this.system.attributes.hp;
			const delta = isDelta ? -1 * value : hp.value + hp.temp - value;
			return this.applyDamage(delta);
		}
		return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Begin stepping through the advancement queue.
	 */
	async #processAdvancementChanges() {
		if (this.#advancementProcessing) throw new Error("Advancement processing already in progress.");
		if (!this.#advancementQueue.length) return;
		this.#advancementProcessing = true;

		do {
			const op = this.#advancementQueue.shift();
			await op.advancement[op.functionName].bind(op.advancement)(...op.parameters);
		} while (this.#advancementQueue.length);

		this.#advancementProcessing = false;
		this.render();

		game.socket.emit(`system.${game.system.id}`, {
			operation: "advancementChangesComplete",
			actorId: this.id
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Resting               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration options for a rest.
	 *
	 * @typedef {object} RestConfiguration
	 * @property {string} type - Type of rest performed (e.g. "short" or "long").
	 * @property {boolean} dialog - Present a dialog window for any rest configuration.
	 * @property {boolean} chat - Should a chat message be created to summarize the results of the rest?
	 */

	/**
	 * Results from a rest operation.
	 *
	 * @typedef {object} RestResult
	 * @property {string} type - Type of rest performed (e.g. "short" or "long").
	 * @property {BlackFlagActor} clone - Clone of the actor from before the rest began.
	 * @property {object} deltas
	 * @property {number} deltas.hitPoints - Hit points recovered during the rest.
	 * @property {object} deltas.hitDice - Hit dice spent or recovered during the rest, grouped by size.
	 * @property {object} actorUpdates - Updates applied to the actor.
	 * @property {object[]} itemUpdates - Updates applied to the actor's items.
	 * @property {BasicRoll[]} rolls - Any rolls that occurred during the rest process, not including hit dice.
	 */

	/**
	 * Take a short rest, possibly spending hit dice and recovering resources and item uses.
	 * @param {RestConfiguration} [config={}] - Configuration options for a short rest.
	 * @returns {Promise<RestResult|void>} - Final result of the rest operation.
	 */
	async shortRest(config = {}) {
		return this.rest(foundry.utils.mergeObject({ type: "short" }, config));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Take a long rest, possibly recovering hit points, resources, and item uses.
	 * @param {RestConfiguration} [config={}] - Configuration options for a long rest.
	 * @returns {Promise<RestResult|void>} - Final result of the rest operation.
	 */
	async longRest(config = {}) {
		return this.rest(foundry.utils.mergeObject({ type: "long" }, config));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform all of the changes needed when the actor rests.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {object} [deltas={}] - Any changes that have been made earlier in the process.
	 * @returns {Promise<RestResult>} - Final result of the rest operation.
	 */
	async rest(config = {}, deltas = {}) {
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		if (!restConfig) return ui.notifications.error(`Rest type ${config.type} was not defined in configuration.`);
		config = foundry.utils.mergeObject({ dialog: true, chat: true }, config);

		const clone = this.clone();
		const initialHitDice = Object.entries(this.system.attributes?.hd?.d ?? {}).reduce((obj, [d, v]) => {
			obj[d] = v.spent;
			return obj;
		}, {});
		const initialHitPoints = this.system.attributes?.hp?.value ?? 0;

		/**
		 * A hook event that fires before the rest dialog is shown.
		 * @function blackFlag.preRestConfiguration
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The actor that is being rested.
		 * @param {RestConfiguration} config - Configuration options for the rest.
		 * @returns {boolean} - Explicitly return `false` to prevent the rest from being started.
		 */
		if (Hooks.call("blackFlag.preRestConfiguration", this, config) === false) return;

		const RestDialog = config.dialog ? restConfig.dialogClass : null;
		if (RestDialog) {
			try {
				foundry.utils.mergeObject(config, await RestDialog.rest(this, config));
			} catch (err) {
				return;
			}
		}
		const result = {
			clone,
			type: config.type,
			deltas: {},
			actorUpdates: {},
			itemUpdates: [],
			rolls: []
		};

		/**
		 * A hook event that fires after the rest dialog is shown.
		 * @function blackFlag.restConfiguration
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The actor that is being rested.
		 * @param {RestConfiguration} config - Configuration options for the rest.
		 * @param {RestResult} result - Details on the rest to be completed.
		 * @returns {boolean} - Explicitly return `false` to prevent the rest from being continued.
		 */
		if (Hooks.call("blackFlag.restConfiguration", this, config, result) === false) return;

		if (this.system.attributes?.hd) {
			let totalHD = 0;
			const hd = this.system.attributes.hd;
			result.deltas.hitDice = Object.keys(hd.d).reduce((obj, d) => {
				obj[d] = (result.deltas.hitDice?.[d] ?? 0) + initialHitDice[d] - hd.d[d].spent;
				totalHD += obj[d];
				return obj;
			}, {});
			result.deltas.hitDice.total = totalHD;
		}
		if (this.system.attributes?.hp) {
			result.deltas.hitPoints = (result.deltas.hitPoints ?? 0) + this.system.attributes.hp.value - initialHitPoints;
		}

		this._getRestHitDiceRecovery(config, result);
		this._getRestHitPointRecovery(config, result);
		this._getRestSpellSlotRecovery(config, result);
		await this._getUsesRecovery(config, result);

		/**
		 * A hook event that fires after rest result is calculated, but before any updates are performed.
		 * @function blackFlag.preRestCompleted
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The actor that is being rested.
		 * @param {RestResult} result - Details on the rest to be completed.
		 * @returns {boolean} - Explicitly return `false` to prevent the rest updates from being performed.
		 */
		if (Hooks.call("blackFlag.preRestCompleted", this, result) === false) return result;

		await this.update(result.actorUpdates);
		await this.updateEmbeddedDocuments("Item", result.itemUpdates);

		if (chat) await this._displayRestResultMessage(result);

		/**
		 * A hook event that fires when the rest process is completed for an actor.
		 * @function blackFlag.restCompleted
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The actor that just completed resting.
		 * @param {RestResult} result - Details on the rest completed.
		 */
		Hooks.callAll("blackFlag.restCompleted", this, result);

		return result;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any hit dice recover needed for this rest.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {RestResult} [result={}] - Rest result being constructed.
	 * @internal
	 */
	_getRestHitDiceRecovery(config = {}, result = {}) {
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		if (!this.system.attributes?.hd || !restConfig.recoverHitDice) return;
		const hd = this.system.attributes.hd;

		// Determine maximum number of hit dice to recover
		let hitDiceToRecover = Math.ceil(this.system.progression.level * CONFIG.BlackFlag.rest.hitDiceRecoveryPercentage);

		const deltas = {};
		const updates = {};
		for (const denomination of Object.keys(hd.d)
			.map(d => Number(d))
			.sort((lhs, rhs) => rhs - lhs)) {
			const spent = hd.d[denomination].spent;
			const delta = Math.min(spent, hitDiceToRecover);
			if (delta > 0) {
				hitDiceToRecover -= delta;
				deltas[denomination] = (result.deltas?.hitDice[denomination] ?? 0) + delta;
				updates[`d.${denomination}.spent`] = spent - delta;
			}
		}

		foundry.utils.mergeObject(result, {
			deltas: { hitDice: deltas },
			actorUpdates: { "system.attributes.hd": updates }
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any hit point recovery needed for this rest.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {RestResult} [result={}] - Rest result being constructed.
	 * @internal
	 */
	_getRestHitPointRecovery(config = {}, result = {}) {
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		if (!this.system.attributes?.hp?.max || !restConfig.recoverHitPoints) return;
		const hp = this.system.attributes.hp;
		const percentage = CONFIG.BlackFlag.rest.hitPointsRecoveryPercentage;
		const final = Math.clamp(hp.value + Math.ceil(hp.max * percentage), 0, hp.max);
		foundry.utils.mergeObject(result, {
			deltas: {
				hitPoints: (result.deltas?.hitPoints ?? 0) + final - hp.value
			},
			actorUpdates: {
				"system.attributes.hp.value": final,
				"system.attributes.hp.temp": 0
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any spell slot recovery needed for this rest.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {RestResult} [result={}] - Rest result being constructed.
	 * @internal
	 */
	_getRestSpellSlotRecovery(config = {}, result = {}) {
		if (!this.system.spellcasting?.slots) return;
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		for (const type of Object.keys(CONFIG.BlackFlag.spellcastingTypes)) {
			if (!restConfig.recoverSpellSlotTypes?.has(type)) continue;
			this.system.getRestSpellcastingRecovery?.(type, config, result);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any item & activity uses recover needed for this rest.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {RestResult} [result={}] - Rest result being constructed.
	 */
	async _getUsesRecovery(config = {}, result = {}) {
		const restConfig = CONFIG.BlackFlag.rest.types[config.type];
		if (!restConfig.recoverPeriods?.length) return;
		const rollData = this.getRollData();
		result.itemUpdates = [];
		result.rolls ??= [];
		for (const item of this.items) {
			if (foundry.utils.getType(item.system.recoverUses) !== "function") continue;
			const { updates, rolls } = await item.system.recoverUses(restConfig.recoverPeriods, rollData);
			if (foundry.utils.isEmpty(updates)) continue;
			const updateTarget = result.itemUpdates.find(i => i._id === item.id);
			if (updateTarget) foundry.utils.mergeObject(updateTarget, updates);
			else result.itemUpdates.push({ _id: item.id, ...updates });
			result.rolls.push(...rolls);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the result of a rest operation in chat.
	 * @param {RestResult} result - Results of the rest.
	 * @returns {Promise<ChatMessage>}
	 * @internal
	 */
	async _displayRestResultMessage(result) {
		const restConfig = CONFIG.BlackFlag.rest.types[result.type];

		const totalHD = Object.keys(this.system.attributes?.hd?.d ?? {}).reduce((t, d) => t + result.deltas.hitDice[d], 0);

		// Determine what localization string should be used for the message content
		let resultType = "Basic";
		if (result.deltas.hitPoints && totalHD) resultType = "Full";
		else if (result.type === "long" && result.deltas.hitPoints) resultType = "HitPoints";
		else if (result.type === "long" && totalHD) resultType = "HitDice";
		const localizationString = `${restConfig.resultMessages}.${resultType}`;

		// Prepare localization data
		const pluralRules = getPluralRules();
		const localizationData = {
			name: this.name,
			hitDice: numberFormat(result.type === "long" ? totalHD : -totalHD),
			hitDiceLabel: game.i18n.localize(`BF.HitDie.Label[${pluralRules.select(totalHD)}]`).toLowerCase(),
			hitPoints: numberFormat(result.deltas.hitPoints),
			hitPointsLabel: game.i18n
				.localize(`BF.HitPoint.Label[${pluralRules.select(result.deltas.hitPoints)}]`)
				.toLowerCase()
		};

		const chatData = {
			content: game.i18n.format(localizationString, localizationData),
			flavor: game.i18n.localize(restConfig.label),
			rolls: result.rolls,
			speaker: ChatMessage.getSpeaker({ actor: this, alias: this.name }),
			system: {
				activations: ActivationsField.getActivations(this, restConfig.activationPeriods ?? []),
				deltas: ActorDeltasField.getDeltas(result.clone, { actor: result.actorUpdates, item: result.itemUpdates }),
				type: result.type
			},
			type: "rest"
		};
		ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
		return ChatMessage.create(chatData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Rolling               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a roll event and pass it on to the indicated rolling method.
	 * @param {string} type - Type of roll to perform.
	 * @param {object} [config] - Additional configuration options.
	 * @param {object} [message] - Configuration data that guides roll message creation.
	 * @param {object} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise}
	 */
	async roll(type, config, message, dialog) {
		switch (type) {
			case "ability-check":
				return this.rollAbilityCheck(config, message, dialog);
			case "ability-save":
				return this.rollAbilitySave(config, message, dialog);
			case "death-save":
				return this.rollDeathSave(config, message, dialog);
			case "hit-die":
				return this.rollHitDie(config, message, dialog);
			case "initiative":
				return this.configureInitiativeRoll(config, message, dialog);
			case "skill":
				return this.rollSkill(config, message, dialog);
			case "tool":
				return this.rollTool(config, message, dialog);
			case "vehicle":
				return this.rollVehicle(config, message, dialog);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration information for an ability roll.
	 *
	 * @typedef {ChallengeRollProcessConfiguration} AbilityRollProcessConfiguration
	 * @property {string} ability - The ability to be rolled.
	 */

	/**
	 * Roll an ability check.
	 * @param {AbilityRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {ChallengeRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollAbilityCheck(config = {}, dialog = {}, message = {}) {
		const ability = this.system.abilities?.[config.ability];
		const rollData = this.getRollData();

		const rollConfig = foundry.utils.deepClone(config);
		rollConfig.subject = this;
		rollConfig.rolls = [
			{
				...buildRoll(
					{
						mod: ability?.mod,
						prof: ability?.check.proficiency.hasProficiency ? ability?.check.proficiency.term : null,
						bonus: this.system.buildBonus?.(ability?.check.modifiers.bonus, { rollData })
					},
					rollData
				),
				options: {
					minimum: this.system.buildMinimum?.(ability?.check.modifiers.minimum, { rollData })
				}
			}
		].concat(config.rolls ?? []);

		const type = game.i18n.format("BF.Ability.Action.CheckSpecific", {
			ability: CONFIG.BlackFlag.abilities.localized[config.ability] ?? ""
		});
		const dialogConfig = foundry.utils.mergeObject(
			{
				options: {
					rollNotes: this.system.getModifiers?.(ability?.check.modifiers._data, "note"),
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
				}
			},
			dialog
		);

		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${flavor}: ${this.name}`,
					flavor: type,
					speaker: ChatMessage.getSpeaker({ actor: this }),
					flags: {
						[game.system.id]: {
							messageType: "roll",
							roll: {
								ability: config.ability,
								type: "ability-check"
							}
						}
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before an ability check is rolled.
		 * @function blackFlag.preRollAbilityCheck
		 * @memberof hookEvents
		 * @param {AbilityRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {ChallengeRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollAbilityCheck", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);

		/**
		 * A hook event that fires after an ability check has been rolled.
		 * @function blackFlag.postRollAbilityCheck
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} data
		 * @param {string} data.ability - ID of the ability that was rolled as defined in `CONFIG.BlackFlag.abilities`.
		 * @param {BlackFlagActor} data.subject - Actor for which the roll has been performed.
		 */
		if (rolls?.length)
			Hooks.callAll("blackFlag.postRollAbilityCheck", rolls, { ability: config.ability, subject: this });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Roll an ability saving throw.
	 * @param {AbilityRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {ChallengeRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollAbilitySave(config = {}, dialog = {}, message = {}) {
		const ability = this.system.abilities?.[config.ability];
		const rollData = this.getRollData();

		const rollConfig = foundry.utils.deepClone(config);
		rollConfig.subject = this;
		rollConfig.rolls = [
			{
				...buildRoll(
					{
						mod: ability?.mod,
						prof: ability?.save.proficiency.hasProficiency ? ability?.save.proficiency.term : null,
						bonus: this.system.buildBonus?.(ability?.save.modifiers.bonus, { rollData })
					},
					rollData
				),
				options: {
					minimum: this.system.buildMinimum?.(ability?.save.modifiers.minimum, { rollData }),
					target: config.target
				}
			}
		].concat(config.rolls ?? []);

		const type = game.i18n.format("BF.Ability.Action.SaveSpecificLong", {
			ability: CONFIG.BlackFlag.abilities.localized[config.ability] ?? ""
		});
		const dialogConfig = foundry.utils.mergeObject(
			{
				options: {
					rollNotes: this.system.getModifiers?.(ability?.save.modifiers._data, "note"),
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
				}
			},
			dialog
		);

		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${flavor}: ${this.name}`,
					flavor: type,
					speaker: ChatMessage.getSpeaker({ actor: this }),
					flags: {
						[game.system.id]: {
							messageType: "roll",
							roll: {
								ability: config.ability,
								type: "ability-save"
							}
						}
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before an save check is rolled.
		 * @function blackFlag.preRollAbilitySave
		 * @memberof hookEvents
		 * @param {AbilityRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {ChallengeRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollAbilitySave", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);

		/**
		 * A hook event that fires after an ability save has been rolled.
		 * @function blackFlag.postRollAbilitySave
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} data
		 * @param {string} data.ability - ID of the ability that was rolled as defined in `CONFIG.BlackFlag.abilities`.
		 * @param {BlackFlagActor} data.subject - Actor for which the roll has been performed.
		 */
		if (rolls?.length)
			Hooks.callAll("blackFlag.postRollAbilitySave", rolls, { ability: config.ability, subject: this });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration data for death saving throw rolls.
	 *
	 * @typedef {ChallengeRollProcessConfiguration} DeathSaveRollProcessConfiguration
	 * @property {number} [successThreshold] - Number of successes required to stabilize.
	 * @property {number} [failureThreshold] - Number of failures required to die.
	 */

	/**
	 * Roll a death saving throw.
	 * @param {DeathSaveRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {ChallengeRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollDeathSave(config = {}, dialog = {}, message = {}) {
		const death = this.system.attributes.death;
		if (!death) return;

		const modifierData = { type: "death-save" };
		const rollData = this.getRollData();

		const rollConfig = foundry.utils.mergeObject(
			{
				successThreshold: death.overrides.success
					? death.overrides.success
					: CONFIG.BlackFlag.deathSave.successThreshold,
				failureThreshold: death.overrides.failure
					? death.overrides.failure
					: CONFIG.BlackFlag.deathSave.failureThreshold
			},
			config
		);
		rollConfig.subject = this;
		rollConfig.rolls = [
			{
				...buildRoll(
					{
						bonus: this.system.buildBonus?.(this.system.getModifiers?.(modifierData), { rollData })
					},
					rollData
				),
				options: {
					minimum: this.system.buildMinimum?.(this.system.getModifiers?.(modifierData, "min"), { rollData }),
					target: config.target ?? death.overrides.target ? death.overrides.target : CONFIG.BlackFlag.deathSave.target
				}
			}
		].concat(config.rolls ?? []);

		const type = game.i18n.localize("BF.Death.Label[one]");
		const dialogConfig = foundry.utils.mergeObject(
			{
				options: {
					rollNotes: this.system.getModifiers?.(modifierData, "note"),
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
				}
			},
			dialog
		);

		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${flavor}: ${this.name}`,
					flavor,
					speaker: ChatMessage.getSpeaker({ actor: this }),
					flags: {
						[game.system.id]: {
							messageType: "roll",
							roll: {
								type: "death-save"
							}
						}
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before an death save is rolled for an Actor.
		 * @function blackFlag.preRollDeathSave
		 * @memberof hookEvents
		 * @param {DeathSaveRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {ChallengeRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent death save from being rolled.
		 */
		if (Hooks.call("blackFlag.preRollDeathSave", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);
		if (!rolls?.length) return;
		const roll = rolls[0];

		const details = { subject: this };

		// Save success
		if (roll.total >= (roll.options.target ?? CONFIG.BlackFlag.deathSave.target)) {
			let successes = (death.success || 0) + 1;

			// Critical success, you're back up!
			if (roll.isCriticalSuccess) {
				details.updates = {
					"system.attributes.death.status": "alive",
					"system.attributes.death.success": 0,
					"system.attributes.death.failure": 0,
					"system.attributes.hp.value": 1
				};
				details.chatString = "BF.Death.Message.CriticalSuccess";
			}

			// Three successes, you're stabilized
			else if (successes >= rollConfig.successThreshold) {
				details.updates = {
					"system.attributes.death.status": "stable",
					"system.attributes.death.success": rollConfig.successThreshold
				};
				details.chatString = "BF.Death.Message.Success";
				details.count = rollConfig.successThreshold;
			}

			// Increment successes
			else
				details.updates = {
					"system.attributes.death.success": Math.clamp(successes, 0, rollConfig.successThreshold)
				};
		}

		// Save failure
		else {
			let failures = (death.failure || 0) + (roll.isCriticalFailure ? 2 : 1);
			details.updates = {
				"system.attributes.death.failure": Math.clamp(failures, 0, rollConfig.failureThreshold)
			};
			// Three failures, you're dead
			if (failures >= rollConfig.failureThreshold) {
				details.updates["system.attributes.death.status"] = "dead";
				details.chatString = "BF.Death.Message.Failure";
				details.count = rollConfig.failureThreshold;
			}
		}

		/**
		 * A hook event that fires after a death saving throw has been rolled for an Actor, but before
		 * updates have been performed.
		 * @function blackFlag.rollDeathSave
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} data
		 * @param {string} data.chatString - Localizable string displayed in the create chat message. If not set,
		 *                                      then no chat message will be displayed.
		 * @param {number} data.count - Number of rolls succeeded or failed to result in this message.
		 * @param {object} data.updates - Updates that will be applied to the actor as a result of this save.
		 * @param {BlackFlagActor} data.subject - Actor for which the death saving throw has been rolled.
		 * @returns {boolean} - Explicitly return `false` to prevent updates from being performed.
		 */
		if (Hooks.call("blackFlag.rollDeathSave", this, rolls, details) === false) return roll;

		if (!foundry.utils.isEmpty(details.updates)) await this.update(details.updates);

		// Display success/failure chat message
		if (details.chatString) {
			const pluralRule = new Intl.PluralRules(game.i18n.lang).select(details.count);
			const numberFormatter = new Intl.NumberFormat(game.i18n.lang);
			const counted = game.i18n.format("BF.Death.Message.Counted", {
				count: numberFormatter.format(details.count),
				label: game.i18n.localize(`BF.Death.Message.Label[${pluralRule}]`)
			});
			let chatData = {
				content: game.i18n.format(details.chatString, { name: this.name, counted }),
				speaker: messageConfig.data.speaker
			};
			ChatMessage.applyRollMode(chatData, roll.options.rollMode);
			await ChatMessage.create(chatData);
		}

		/**
		 * A hook event that fires after a death saving throw has been rolled and the actor has been updated.
		 * @function blackFlag.postRollDeathSave
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} data
		 * @param {BlackFlagActor} data.subject - Actor for which the death saving throw has been rolled.
		 */
		Hooks.callAll("blackFlag.postRollDeathSave", rolls, { subject: this });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration data for a hit die roll.
	 *
	 * @typedef {BasicRollProcessConfiguration} HitDieRollProcessConfiguration
	 * @property {number} [denomination] - Denomination of hit dice to roll.
	 * @property {boolean} [modifySpentHitDie=true] - Should the actor's spent hit die count be updated?
	 * @property {boolean} [modifyHitPoints=true] - Should the actor's hit points be updated after the roll?
	 */

	/**
	 * Roll one of the actor's hit die and add its value to their health.
	 * @param {HitDieRollConfiguration} [config] - Configuration information for the roll.
	 * @param {BasicRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<BasicRoll[]|void>}
	 */
	async rollHitDie(config = {}, dialog = {}, message = {}) {
		if (!this.system.attributes?.hd) return;

		// If no denomination is chosen, use the highest HD that is available
		if (!config.denomination) {
			config.denomination = Object.entries(this.system.attributes.hd.d)
				.filter(([k, v]) => v.available > 0)
				.sort((lhs, rhs) => rhs[1].available - lhs[1].available)[0]?.[0];
			if (!config.denomination) {
				return ui.notifications.warn("BF.HitDie.Warning.NoneAvailableGeneric", { localize: true });
			}
		}

		// Ensure there is a hit die to spend
		else if (!this.system.attributes.hd.d[config.denomination]?.available) {
			return ui.notifications.warn(
				game.i18n.format("BF.HitDie.Warning.NoneAvailableSpecific", {
					denomination: config.denomination
				})
			);
		}

		const rollData = this.getRollData();
		const modifierData = { type: "hit-die", denomination: config.denomination };
		const minimum = this.system.buildMinimum?.(this.system.getModifiers?.(modifierData, "min"), { rollData });

		let die = `1d${config.denomination}`;
		if (minimum) die = `${die}min${minimum}`;
		config.denomination = Number(config.denomination);
		const rollConfig = foundry.utils.deepClone(config);
		rollConfig.rolls = [
			{
				...buildRoll(
					{
						base: `max(0, ${die} + @abilities.${CONFIG.BlackFlag.defaultAbilities.hitPoints}.mod)`,
						bonus: this.system.buildBonus?.(this.system.getModifiers?.(modifierData), { rollData })
					},
					rollData
				)
			}
		].concat(config.rolls ?? []);

		const type = game.i18n.localize("BF.HitDie.Label[one]");
		const dialogConfig = foundry.utils.mergeObject(
			{
				configure: false,
				options: {
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
				}
			},
			dialog
		);

		const flavor = game.i18n.format("BF.Roll.Type.Label", { type });
		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${flavor}: ${this.name}`,
					flavor: flavor,
					speaker: ChatMessage.getSpeaker({ actor: this }),
					flags: {
						[game.system.id]: {
							messageType: "roll",
							roll: {
								denomination: config.denomination,
								type: "hit-die"
							}
						}
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before a hit die is rolled.
		 * @function blackFlag.preRollHitDie
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the roll is being performed.
		 * @param {HitDieRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollHitDie", this, rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.BasicRoll.build(rollConfig, dialogConfig, messageConfig);

		const updates = {};
		if (rollConfig.modifySpentHitDie !== false) {
			const hd = this.system.attributes.hd.d[config.denomination];
			updates[`system.attributes.hd.d.${config.denomination}.spent`] = hd.spent + 1;
		}
		if (rollConfig.modifyHitPoints !== false) {
			const hp = this.system.attributes.hp;
			updates["system.attributes.hp.value"] = Math.min(hp.max, hp.value + (rolls[0]?.total ?? 0));
		}

		/**
		 * A hook event that fires after a hit die has been rolled for an Actor, but before updates have been performed.
		 * @function blackFlag.rollHitDie
		 * @memberof hookEvents
		 * @param {BasicRoll[]} rolls - The resulting rolls.
		 * @param {object} data
		 * @param {BlackFlagActor} data.subject - Actor for which the roll has been performed.
		 * @param {object} data.updates - Updates that will be applied to the actor.
		 * @returns {boolean} - Explicitly return `false` to prevent updates from being performed.
		 */
		if (Hooks.call("blackFlag.rollHitDie", rolls, { subject: this, updates }) === false) return rolls;

		if (!foundry.utils.isEmpty(updates)) await this.update(updates);

		/**
		 * A hook event that fires after a hit die has been rolled for an Actor and updates have been performed.
		 * @function blackFlag.postRollHitDie
		 * @memberof hookEvents
		 * @param {BasicRoll[]} rolls - The resulting rolls.
		 * @param {object} data
		 * @param {BlackFlagActor} data.subject - Actor for which the roll has been performed.
		 */
		Hooks.callAll("blackFlag.postRollHitDie", rolls, { subject: this });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * @typedef {ChallengeRollProcessConfiguration} InitiativeRollProcessConfiguration
	 * @property {number} [fixed] - Fixed initiative value, will bypass any rolling.
	 */

	/**
	 * Construct an initiative roll.
	 * @param {ChallengeRollOptions} [options] - Options for the roll.
	 * @returns {InitiativeRollProcessConfiguration}
	 */
	getInitiativeRollConfig(options = {}) {
		const rollConfig = this.system.getInitiativeRollConfig?.(options) ?? {};

		/**
		 * A hook event that fires when initiative roll configuration is being prepared.
		 * @function blackFlag.initiativeConfig
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the initiative is being configured.
		 * @param {InitiativeRollProcessConfiguration} config - Configuration data for the pending roll.
		 */
		Hooks.callAll("blackFlag.initiativeConfig", this, rollConfig);

		return rollConfig;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Present the initiative roll configuration dialog and then roll initiative.
	 * @param {InitiativeRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {ChallengeRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @returns {Promise<Combat|void>}
	 */
	async configureInitiativeRoll(config = {}, dialog = {}) {
		const init = this.system.attributes?.initiative ?? {};
		const rollConfig = foundry.utils.mergeObject(this.getInitiativeRollConfig(config.options), config);

		if (rollConfig.fixed) {
			return await this.rollInitiative({
				createCombatants: true,
				initiativeOptions: { formula: `${rollConfig.fixed}` }
			});
		}

		const dialogConfig = foundry.utils.mergeObject(
			{
				options: {
					rollNotes: this.system.getModifiers?.(init.modifiers?._data, "note"),
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", {
						type: game.i18n.localize("BF.Initiative.Label")
					})
				}
			},
			dialog
		);

		const Roll = CONFIG.Dice.ChallengeRoll;
		Roll.applyKeybindings(rollConfig, dialogConfig);

		let rolls;
		if (dialogConfig.configure) {
			let DialogClass = dialogConfig.applicationClass ?? Roll.DefaultConfigurationDialog;
			try {
				rolls = await DialogClass.configure(rollConfig, dialogConfig);
			} catch (err) {
				if (!err) return;
				throw err;
			}
		} else {
			rolls = Roll.create(rollConfig);
		}

		if (!rolls?.length) return;
		this._cachedInitiativeRolls = rolls;
		await this.rollInitiative({ createCombatants: true });
		delete this._cachedInitiativeRolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async rollInitiative(options = {}) {
		/**
		 * A hook event that fires before initiative is rolled for an Actor.
		 * @function blackFlag.preRollInitiative
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - Actor for which the initiative is being rolled.
		 * @param {ChallengeRoll[]} roll - The initiative rolls.
		 * @returns {boolean} - Explicitly return `false` to prevent initiative from being rolled.
		 */
		if (Hooks.call("blackFlag.preRollInitiative", this, this._cachedInitiativeRolls) === false) return;

		const combat = await super.rollInitiative(options);
		const combatants = this.isToken
			? this.getActiveTokens(false, true).filter(t => game.combat.getCombatantByToken(t.id))
			: [game.combat.getCombatantByActor(this.id)];

		/**
		 * A hook event that fires after an Actor has rolled for initiative.
		 * @function blackFlag.rollInitiative
		 * @memberof hookEvents
		 * @param {BlackFlagActor} actor - The Actor that has rolled initiative.
		 * @param {CombatantEH[]} combatants - The associated Combatants in the Combat.
		 */
		Hooks.callAll("blackFlag.rollInitiative", this, combatants);

		return combat;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * @typedef {ChallengeRollProcessConfiguration} SkillRollProcessConfiguration
	 * @property {string} skill - The skill to roll.
	 * @property {string} [ability] - The ability to be rolled with the skill.
	 */

	/**
	 * @typedef {ChallengeRollDialogConfiguration} SkillRollDialogConfiguration
	 * @property {SkillRollConfigurationDialogOptions} [options] - Configuration options.
	 */

	/**
	 * Roll a skill check.
	 * @param {Partial<SkillRollProcessConfiguration>} [config] - Configuration information for the roll.
	 * @param {Partial<SkillRollDialogConfiguration>} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {Partial<BasicRollMessageConfiguration>} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollSkill(config = {}, dialog = {}, message = {}) {
		const skill = this.system.proficiencies?.skills?.[config.skill];
		if (!skill) return this.rollAbilityCheck(config, dialog, message);
		const rollData = this.getRollData();

		const prepareSkillConfig = (baseConfig, rollConfig, formData, index) => {
			const abilityId = formData?.get("ability") ?? baseConfig.ability ?? skill.ability;
			const ability = this.system.abilities[abilityId];

			const modifierData = [
				{ type: "ability-check", ability: abilityId, proficiency: skill.proficiency.multiplier },
				{ type: "skill-check", ability: abilityId, skill: config.skill, proficiency: skill.proficiency.multiplier }
			];

			rollConfig = foundry.utils.mergeObject(rollConfig, {
				...buildRoll(
					{
						mod: ability?.mod,
						prof: skill.proficiency.hasProficiency ? skill.proficiency.term : null,
						bonus: this.system.buildBonus?.(this.system.getModifiers?.(modifierData), { rollData }),
						situational: rollConfig.data?.situational
					},
					{ ...rollData }
				),
				options: {
					minimum: this.system.buildMinimum?.(this.system.getModifiers?.(modifierData, "min"), { rollData }),
					target: rollConfig.target ?? config.target
				}
			});
			rollConfig.data.abilityId = abilityId;

			return { rollConfig, rollNotes: this.system.getModifiers?.(modifierData, "note") };
		};

		const rollConfig = foundry.utils.deepClone(config);
		const { rollConfig: roll, rollNotes } = prepareSkillConfig(rollConfig, {});
		rollConfig.subject = this;
		rollConfig.rolls = [roll].concat(config.rolls ?? []);

		const type = game.i18n.format("BF.Skill.Action.CheckSpecific", {
			skill: game.i18n.localize(CONFIG.BlackFlag.skills[config.skill].label)
		});
		const dialogConfig = foundry.utils.mergeObject(
			{
				applicationClass: SkillRollConfigurationDialog,
				options: {
					buildConfig: prepareSkillConfig,
					chooseAbility: true,
					rollNotes,
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
				}
			},
			dialog
		);

		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${flavor}: ${this.name}`,
					flavor: type,
					speaker: ChatMessage.getSpeaker({ actor: this }),
					flags: {
						[game.system.id]: {
							messageType: "roll",
							roll: {
								skill: rollConfig.skill,
								type: "skill"
							}
						}
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before a skill check is rolled.
		 * @function blackFlag.preRollSkill
		 * @memberof hookEvents
		 * @param {SkillRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {SkillRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollSkill", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);

		/**
		 * A hook event that fires after a skill check has been rolled.
		 * @function blackFlag.postRollSkill
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} data
		 * @param {string} data.skill - ID of the skill that was rolled as defined in `CONFIG.BlackFlag.skills`.
		 * @param {BlackFlagActor} data.subject - Actor for which the roll has been performed.
		 */
		if (rolls?.length) Hooks.callAll("blackFlag.postRollSkill", rolls, { skill: config.skill, subject: this });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration information for a tool roll.
	 *
	 * @typedef {ChallengeRollProcessConfiguration} ToolRollProcessConfiguration
	 * @property {string} tool - The tool to roll.
	 * @property {string} [ability] - The ability to be rolled with the tool.
	 */

	/**
	 * Roll a Tool check.
	 * @param {ToolRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {ChallengeRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollTool(config = {}, dialog = {}, message = {}) {
		let tool = this.system.proficiencies?.tools?.[config.tool];
		if (!tool) {
			const toolConfig = Trait.configForKey(config.tool, { trait: "tools" });
			if (!toolConfig) return;
			tool = {
				label: toolConfig.label,
				proficiency: new Proficiency(this.system.attributes.proficiency, 0)
			};
		}
		const rollData = this.getRollData();

		const prepareToolConfig = (baseConfig, rollConfig, formData, index) => {
			const abilityId = formData?.get("ability") ?? baseConfig.ability ?? tool.ability ?? "intelligence";
			const ability = this.system.abilities[abilityId];

			const modifierData = [
				{ type: "ability-check", ability: abilityId, proficiency: tool.proficiency.multiplier },
				{ type: "tool-check", ability: abilityId, tool: config.tool, proficiency: tool.proficiency.multiplier }
			];

			rollConfig = foundry.utils.mergeObject(rollConfig, {
				...buildRoll(
					{
						mod: ability?.mod,
						prof: tool.proficiency.hasProficiency ? tool.proficiency.term : null,
						bonus: this.system.buildBonus?.(this.system.getModifiers?.(modifierData), { rollData }),
						situational: rollConfig.data?.situational
					},
					{ ...rollData }
				),
				options: {
					minimum: this.system.buildMinimum?.(this.system.getModifiers?.(modifierData, "min"), { rollData }),
					target: rollConfig.target ?? config.target
				}
			});
			rollConfig.data.abilityId = abilityId;

			return { rollConfig, rollNotes: this.system.getModifiers?.(modifierData, "note") };
		};

		const rollConfig = foundry.utils.deepClone(config);
		const { rollConfig: roll, rollNotes } = prepareToolConfig(rollConfig, {});
		rollConfig.subject = this;
		rollConfig.rolls = [roll].concat(config.rolls ?? []);

		const type = game.i18n.format("BF.Tool.Action.CheckSpecific", {
			tool: game.i18n.localize(tool.label)
		});
		const dialogConfig = foundry.utils.mergeObject(
			{
				applicationClass: SkillRollConfigurationDialog,
				options: {
					buildConfig: prepareToolConfig,
					chooseAbility: true,
					rollNotes,
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
				}
			},
			dialog
		);

		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${flavor}: ${this.name}`,
					flavor: type,
					speaker: ChatMessage.getSpeaker({ actor: this }),
					flags: {
						[game.system.id]: {
							messageType: "roll",
							roll: {
								tool: rollConfig.tool,
								type: "tool"
							}
						}
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before a tool check is rolled.
		 * @function blackFlag.preRollTool
		 * @memberof hookEvents
		 * @param {ToolRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {ChallengeRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollTool", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);

		/**
		 * A hook event that fires after a tool check has been rolled.
		 * @function blackFlag.postRollTool
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {object} data
		 * @param {BlackFlagActor} data.subject - Actor for which the roll has been performed.
		 * @param {string} data.tool - ID of the tool that was rolled as defined in `CONFIG.BlackFlag.tools`.
		 */
		if (rolls?.length) Hooks.callAll("blackFlag.postRollTool", rolls, { subject: this, tool: config.tool });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration information for a vehicle roll.
	 *
	 * @typedef {ChallengeRollProcessConfiguration} VehicleRollProcessConfiguration
	 * @property {string} vehicle - The vehicle type to roll.
	 * @property {string} [ability] - The ability to be rolled with the vehicle.
	 */

	/**
	 * Roll a Vehicle check.
	 * @param {VehicleRollProcessConfiguration} [config] - Configuration information for the roll.
	 * @param {ChallengeRollDialogConfiguration} [dialog] - Presentation data for the roll configuration dialog.
	 * @param {BasicRollMessageConfiguration} [message] - Configuration data that guides roll message creation.
	 * @returns {Promise<ChallengeRoll[]|void>}
	 */
	async rollVehicle(config = {}, dialog = {}, message = {}) {
		let vehicle = this.system.proficiencies?.vehicles?.[config.vehicle];
		if (!vehicle) {
			const vehicleConfig = Trait.configForKey(config.vehicle, { trait: "vehicles" });
			if (!vehicleConfig) return;
			vehicle = {
				label: vehicleConfig.label,
				proficiency: new Proficiency(this.system.attributes.proficiency, 0)
			};
		}
		const rollData = this.getRollData();

		const prepareVehicleConfig = (baseConfig, rollConfig, formData, index) => {
			const abilityId = formData?.get("ability") ?? baseConfig.ability ?? vehicle.ability ?? "dexterity";
			const ability = this.system.abilities[abilityId];

			const modifierData = [
				{ type: "ability-check", ability: abilityId, proficiency: vehicle.proficiency.multiplier },
				{
					type: "vehicle-check",
					ability: abilityId,
					vehicle: config.vehicle,
					proficiency: vehicle.proficiency.multiplier
				}
			];

			rollConfig = foundry.utils.mergeObject(rollConfig, {
				...buildRoll(
					{
						mod: ability?.mod,
						prof: vehicle.proficiency.hasProficiency ? vehicle.proficiency.term : null,
						bonus: this.system.buildBonus?.(this.system.getModifiers?.(modifierData), { rollData }),
						situational: rollConfig.data?.situational
					},
					{ ...rollData }
				),
				options: {
					minimum: this.system.buildMinimum?.(this.system.getModifiers?.(modifierData, "min"), { rollData }),
					target: rollConfig.target ?? config.target
				}
			});
			rollConfig.data.abilityId = abilityId;

			return { rollConfig, rollNotes: this.system.getModifiers?.(modifierData, "note") };
		};

		const rollConfig = foundry.utils.deepClone(config);
		const { rollConfig: roll, rollNotes } = prepareVehicleConfig(rollConfig, {});
		rollConfig.subject = this;
		rollConfig.rolls = [roll].concat(config.rolls ?? []);

		const type = game.i18n.format("BF.VEHICLE.Action.CheckSpecific", {
			vehicle: game.i18n.localize(vehicle.label)
		});
		const dialogConfig = foundry.utils.mergeObject(
			{
				applicationClass: SkillRollConfigurationDialog,
				options: {
					buildConfig: prepareVehicleConfig,
					chooseAbility: true,
					rollNotes,
					title: game.i18n.format("BF.Roll.Configuration.LabelSpecific", { type })
				}
			},
			dialog
		);

		const flavor = game.i18n.format("BF.Roll.Action.RollSpecific", { type });
		const messageConfig = foundry.utils.mergeObject(
			{
				data: {
					title: `${flavor}: ${this.name}`,
					flavor: type,
					speaker: ChatMessage.getSpeaker({ actor: this }),
					flags: {
						[game.system.id]: {
							messageType: "roll",
							roll: {
								type: "vehicle",
								vehicle: rollConfig.vehicle
							}
						}
					}
				}
			},
			message
		);

		/**
		 * A hook event that fires before a vehicle check is rolled.
		 * @function blackFlag.preRollVehicle
		 * @memberof hookEvents
		 * @param {VehicleRollProcessConfiguration} config - Configuration data for the pending roll.
		 * @param {ChallengeRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
		 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
		 * @returns {boolean} - Explicitly return `false` to prevent the roll.
		 */
		if (Hooks.call("blackFlag.preRollVehicle", rollConfig, dialogConfig, messageConfig) === false) return;

		const rolls = await CONFIG.Dice.ChallengeRoll.build(rollConfig, dialogConfig, messageConfig);

		/**
		 * A hook event that fires after a vehicle check has been rolled.
		 * @function blackFlag.postRollVehicle
		 * @memberof hookEvents
		 * @param {ChallengeRoll[]} rolls - The resulting rolls.
		 * @param {BlackFlagActor} data.subject - Actor for which the roll has been performed.
		 * @param {string} data.vehicle - ID of the vehicle type that was rolled as defined in `CONFIG.BlackFlag.vehicles`.
		 */
		if (rolls?.length) Hooks.callAll("blackFlag.postRollVehicle", rolls, { subject: this, vehicle: config.vehicle });

		return rolls;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Context Menus            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set up any hooks relevant to actor rendering.
	 */
	static setupHooks() {
		Hooks.on("getActorDirectoryEntryContext", this.getActorDirectoryEntryContext);
		Hooks.on("getUserContextOptions", this.getUserContextOptions);
		game.socket.on(`system.${game.system.id}`, data => {
			if (data?.operation === "advancementChangesComplete") game.actors.get(data.actorId)?.render();
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the "Grant Luck" context option for GMs on PC actors in sidebar.
	 * @param {jQuery} jQuery - The Application's rendered HTML.
	 * @param {ContextMenuEntry[]} menuItems - The array of menu items being rendered.
	 */
	static getActorDirectoryEntryContext(jQuery, menuItems) {
		const ownershipIndex = menuItems.findIndex(o => o.icon.includes("fa-lock"));
		menuItems.splice(ownershipIndex + 1, 0, {
			name: "BF.Luck.Action.Grant",
			icon: '<i class="fa-solid fa-clover"></i>',
			condition: li => {
				if (!game.user.isGM) return false;
				const actor = game.actors.get(li[0].dataset.documentId);
				return actor?.type === "pc";
			},
			callback: li => {
				const actor = game.actors.get(li[0].dataset.documentId);
				actor.system.addLuck();
			},
			group: "system"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the "Grant Luck" context option for GMs on players.
	 * @param {jQuery} jQuery - The Application's rendered HTML.
	 * @param {ContextMenuEntry[]} menuItems - The array of menu items being rendered.
	 */
	static getUserContextOptions(jQuery, menuItems) {
		const viewAvatarIndex = menuItems.findIndex(o => o.icon.includes("fa-image"));
		menuItems.splice(viewAvatarIndex + 1, 0, {
			name: "BF.Luck.Action.Grant",
			icon: '<i class="fa-solid fa-clover"></i>',
			condition: li => {
				if (!game.user.isGM) return false;
				const user = game.users.get(li[0].dataset.userId);
				return user.character?.type === "pc";
			},
			callback: li => {
				const actor = game.users.get(li[0].dataset.userId).character;
				actor.system.addLuck();
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
		if (userId === game.userId && collection === "items") {
			await this.system.updateEncumbrance?.(options);
			if (!options.keepRelationship) {
				const updates = documents.map(d => ({ _id: d.id, [`flags.${game.system.id}.relationship.enabled`]: true }));
				await this.updateEmbeddedDocuments("Item", updates);
			}
		}
		super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId) {
		if (userId === game.userId && collection === "items") await this.system.updateEncumbrance?.(options);
		super._onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onDelete(options, userId) {
		super._onDelete(options, userId);
		const origin = this.getFlag(game.system.id, "summon.origin");
		if (origin) BlackFlag.registry.summons.untrack(origin.split(".Item.")[0], this.uuid);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
		if (userId === game.userId && collection === "items") await this.system.updateEncumbrance?.(options);
		super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
	}
}
