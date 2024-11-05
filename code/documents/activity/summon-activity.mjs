import SummonActivationDialog from "../../applications/activity/summon-activation-dialog.mjs";
import TokenPlacement from "../../canvas/token-placement.mjs";
import { SummonData } from "../../data/activity/summon-data.mjs";
import { buildRoll, simplifyFormula, staticID } from "../../utils/_module.mjs";
import Activity from "./activity.mjs";

/**
 * Activity for summoning creatures.
 */
export default class SummonActivity extends Activity {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "summon",
				dataModel: SummonData,
				icon: "systems/black-flag/artwork/activities/summon.svg",
				title: "BF.SUMMON.Title",
				hint: "BF.SUMMON.Hint",
				usage: {
					actions: {
						placeSummons: SummonActivity.#placeSummons
					},
					dialog: SummonActivationDialog
				}
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does the user have permissions to summon?
	 * @type {boolean}
	 */
	get canSummon() {
		return game.user.can("TOKEN_CREATE") && (game.user.isGM || game.settings.get(game.system.id, "allowSummoning"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Activation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * @typedef {ActivityActivationConfiguration} SummonActivationConfiguration
	 * @property {object|false} create
	 * @property {string} create.summons                    Should a summoned creature be created?
	 * @property {Partial<SummoningConfiguration>} summons  Options for configuring summoning behavior.
	 */

	/**
	 * @typedef {object} SummoningConfiguration
	 * @property {string} profile         ID of the summoning profile to use.
	 * @property {string} [creatureSize]  Selected creature size if multiple are available.
	 * @property {string} [creatureType]  Selected creature type if multiple are available.
	 */

	/**
	 * @typedef {ActivityActivationResults} SummonUsageResults
	 * @property {BlackFlagToken[]} summoned  Summoned tokens.
	 */

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_prepareActivationConfig(config) {
		config = super._prepareActivationConfig(config);
		const summons = this.system.availableProfiles;

		config.create ??= {};
		config.create.summons ??= this.canSummon && canvas.scene && summons.length && this.system.summon.prompt;

		config.summons ??= {};
		config.summons.profile ??= summons[0]?._id ?? null;
		config.summons.creatureSize ??= this.system.creatureSizes.first() ?? null;
		config.summons.creatureType ??= this.system.creatureTypes.first() ?? null;

		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_activationChatButtons(message) {
		if (!this.system.availableProfiles.length) return super._activationChatButtons(message);
		return [
			{
				label: game.i18n.localize("BF.SUMMON.Action.Summon"),
				icon: '<i class="fa-solid fa-spaghetti-monster-flying" inert></i>',
				dataset: {
					action: "placeSummons"
				}
			}
		].concat(super._activationChatButtons(message));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	shouldHideChatButton(button, message) {
		if (button.dataset.action === "placeSummons") return !this.canSummon;
		return super.shouldHideChatButton(button, message);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _finalizeActivation(config, results) {
		await super._finalizeActivation(config, results);
		if (config.create?.summons) {
			try {
				results.summoned = await this.placeSummons(config.summons);
			} catch (err) {
				results.summoned = [];
				Hooks.onError("SummonActivity#activate", err, { log: "error", notify: "error" });
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Summoning              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Process for summoning actor to the scene.
	 * @param {SummoningConfiguration} options - Configuration data for summoning behavior.
	 * @returns {BlackFlagToken[]|void}
	 */
	async placeSummons(options) {
		if (!canvas.scene) throw new Error(game.i18n.localize("BF.SUMMON.Warning.NoScene"));
		if (!this.canSummon) throw new Error(game.i18n.localize("BF.SUMMON.Warning.CreateToken"));

		// Retrieve profile information
		const profile = this.system.profiles.find(p => p._id === options?.profile);
		if (!profile)
			throw new Error(
				game.i18n.format("BF.SUMMONG.Warning.NoProfile", { profileId: options?.profile, item: this.item.name })
			);

		// TODO: Hook

		// Fetch the actor that will be summoned
		const summonUuid = this.system.summon.mode === "cr" ? await this.queryActor(profile) : profile.uuid;
		if (!summonUuid) return;
		const actor = await this.fetchActor(summonUuid);

		// Verify ownership of actor
		if (!actor.isOwner) throw new Error(game.i18n.format("BF.SUMMON.Warning.NoOwnership", { actor: actor.name }));

		const tokensData = [];
		const minimized = !this.actor?.sheet._minimized;
		await this.actor?.sheet.minimize();
		try {
			// Figure out where to place the summons
			const placements = await this.getPlacement(actor.prototypeToken, profile, options);

			for (const placement of placements) {
				// Prepare changes to actor data, re-calculating per-token for potentially random values
				const tokenUpdateData = {
					actor,
					placement,
					...(await this.getChanges(actor, profile, options))
				};

				// TODO: Hook

				// Create a token document and apply updates
				const tokenData = await this.getTokenData(tokenUpdateData);

				// TODO: Hook

				tokensData.push(tokenData);
			}
		} finally {
			if (minimized) this.actor?.sheet.maximize();
		}

		const createdTokens = await canvas.scene.createEmbeddedDocuments("Token", tokensData);

		// TODO: Hook

		return createdTokens;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * If actor to be summoned is in a compendium, create a local copy or use an already imported version if present.
	 * @param {string} uuid - UUID of actor that will be summoned.
	 * @returns {BlackFlagActor} - Local copy of actor.
	 */
	async fetchActor(uuid) {
		const actor = await fromUuid(uuid);
		if (!actor) throw new Error(game.i18n.format("BF.SUMMON.Warning.NoActor", { uuid }));

		const actorLink = actor.prototypeToken.actorLink;
		if (!actor.pack && (!actorLink || actor.getFlag(game.system.id, "summon.origin") === this.uuid)) return actor;

		// Search world actors to see if any usable summoned actor instances are present from prior summonings.
		// Linked actors must match the summoning origin (activity) to be considered.
		const localActor = game.actors.find(
			a =>
				// Has been cloned for summoning use
				a.getFlag(game.system.id, "summonedCopy") &&
				// Sourced from the desired actor UUID
				a._stats?.compendiumSource === uuid &&
				// Unlinked or created from this activity specifically
				(a.getFlag(game.system.id, "summon.origin") === this.uuid || !a.prototypeToken.actorLink)
		);
		if (localActor) return localActor;

		// Check permissions to create actors before importing
		if (!game.user.can("ACTOR_CREATE")) throw new Error(game.i18n.localize("BF.SUMMON.Warning.CreateActor"));

		// No suitable world actor was found, create a new actor for this summoning instance.
		if (actor.pack) {
			// Template actor resides only in compendium, import the actor into the world and set the flag.
			return game.actors.importFromCompendium(game.packs.get(actor.pack), actor.id, {
				[`flags.${game.system.id}.summonedCopy`]: true
			});
		} else {
			// Template actor (linked) found in world, create a copy for this user's item.
			return actor.clone(
				{
					[`flags.${game.system.id}.summonedCopy`]: true,
					"_stats.compendiumSource": actor.uuid
				},
				{ save: true }
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Request a specific actor to summon from the player.
	 * @param {SummonsProfile} profile - Profile used for summoning.
	 * @returns {Promise<string|null>} - UUID of the concrete actor to summon or `null` if canceled.
	 */
	async queryActor(profile) {
		// TODO: Complete once Compendium Browser is implemented
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the updates to apply to the summoned actor and its token.
	 * @param {BlackFlagActor} actor - Actor that will be modified.
	 * @param {SummonsProfile} profile - Summoning profile used to summon the actor.
	 * @param {SummoningConfiguration} options - Configuration data for summoning behavior.
	 * @returns {Promise<{actorUpdates: object, tokenUpdates: object}>} - Changes that will be applied to the actor,
	 *                                                                    its items, and its token.
	 */
	async getChanges(actor, profile, options) {
		const actorUpdates = { effects: [], items: [] };
		const tokenUpdates = {};
		const rollData = { ...this.getRollData(), summon: actor.getRollData() };
		const prof = rollData.attributes?.proficiency ?? 0;

		// Add flags
		actorUpdates[`flags.${game.system.id}.summon`] = {
			level: this.relevantLevel,
			mod: rollData.mod,
			origin: this.uuid,
			profile: profile._id
		};

		// Match proficiency
		if (this.system.match.proficiency) {
			const proficiencyEffect = new ActiveEffect({
				_id: staticID("bfMatchProficiency"),
				changes: [
					{
						key: "system.attributes.proficiency",
						mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
						value: prof
					}
				],
				disabled: false,
				icon: "icons/skills/targeting/crosshair-bars-yellow.webp",
				name: game.i18n.localize("BF.SUMMON.FIELDS.match.proficiency.label")
			});
			actorUpdates.effects.push(proficiencyEffect.toObject());
		}

		// Add bonus to AC
		if (this.system.bonuses.ac) {
			const acBonus = new Roll(this.system.bonuses.ac, rollData);
			await acBonus.evaluate();
			if (acBonus.total) {
				// If override is set, increase it directly
				if (actor.system.attributes.ac.override) {
					actorUpdates["system.attributes.ac.override"] = actor.system.attributes.ac.override + acBonus.total;
				}

				// Otherwise create an active effect with an armor class bonus modifier
				else
					actorUpdates.effects.push(
						new ActiveEffect({
							_id: staticID("bfACBonus"),
							changes: [
								{
									key: "system.modifiers",
									mode: CONST.ACTIVE_EFFECT_MODES.ADD,
									value: JSON.stringify({
										type: "bonus",
										filter: [{ k: "type", v: "armor-class" }],
										formula: acBonus.total
									})
								}
							],
							disabled: false,
							icon: "icons/magic/defensive/shield-barrier-blue.webp",
							name: game.i18n.localize("BF.SUMMON.FIELDS.bonuses.ac.label")
						}).toObject()
					);
			}
		}

		// Add bonus to HP
		if (this.system.bonuses.hp) {
			const hpBonus = new Roll(this.system.bonuses.hp, rollData);
			await hpBonus.evaluate();

			// If non-zero hp bonus, apply as needed for this actor.
			// Note: Only unlinked NPCs will have their current HP set to their new max HP
			if (hpBonus.total) {
				// Helper function for modifying max HP ('bonuses.overall' or 'max')
				const maxHPEffect = hpField => {
					return new ActiveEffect({
						_id: staticID("bfHPBonus"),
						changes: [
							{
								key: `system.attributes.hp.${hpField}`,
								mode: CONST.ACTIVE_EFFECT_MODES.ADD,
								value: hpBonus.total
							}
						],
						disabled: false,
						icon: "icons/magic/life/heart-glowing-red.webp",
						name: game.i18n.localize("BF.SUMMON.FIELDS.bonuses.hp.label")
					}).toObject();
				};

				// PCs without an HP override get an effect targeting overall bonus or override, if set
				if (actor.type === "pc")
					actorUpdates.effects.push(
						maxHPEffect(actor._source.system.attributes.hp.override ? "override" : "bonuses.overall")
					);
				// Linked NPCs get a boost to their max, but no change to their current HP
				else if (actor.prototypeToken.actorLink) actorUpdates.effects.push(maxHpEffect("max"));
				// Unlinked NPCs get direct changes to their max and current HP
				else {
					actorUpdates["system.attributes.hp.max"] = actor.system.attributes.hp.max + hpBonus.total;
					actorUpdates["system.attributes.hp.value"] = actor.system.attributes.hp.value + hpBonus.total;
				}
			}
		}

		// Change creature size
		if (this.system.creatureSizes.size) {
			const size = this.system.creatureSizes.has(options.creatureSize)
				? options.creatureSize
				: this.system.creatureSizes.first();
			const config = CONFIG.BlackFlag.sizes[size];
			if (config) {
				actorUpdates["system.traits.size"] = size;
				tokenUpdates.width = config.scale ?? 1;
				tokenUpdates.height = config.scale ?? 1;
			}
		}

		// Change creature type
		if (this.system.creatureTypes.size) {
			const type = this.system.creatureTypes.has(options.creatureType)
				? options.creatureType
				: this.system.creatureTypes.first();
			actorUpdates["system.traits.type.value"] = type;
		}

		const damageBonuses = {
			attack: "attackDamage",
			save: "saveDamage",
			heal: "healing"
		};
		for (const [key, field] of Object.entries(damageBonuses)) {
			const bonus = Roll.replaceFormulaData(this.system.bonuses[field] ?? "", rollData);
			if (!bonus) continue;
			actorUpdates.effects.push(
				new ActiveEffect({
					_id: staticID(`bf${key.capitalize()}DamageBonus`),
					changes: [
						{
							key: "system.modifiers",
							mode: CONST.ACTIVE_EFFECT_MODES.ADD,
							value: JSON.stringify({
								type: "bonus",
								filter: [
									{ k: "type", v: "damage" },
									{ k: "kind", v: key }
								],
								formula: bonus
							})
						}
					],
					disabled: false,
					icon: "icons/skills/melee/strike-slashes-orange.webp",
					name: game.i18n.localize(`BF.SUMMON.FIELDS.bonuses.${field}.label`)
				}).toObject()
			);
		}

		for (const item of actor.items) {
			if (!item.system.activities?.size) continue;
			const changes = [];

			// Match attacks
			if (this.system.match.attacks && item.system.activities?.byType("attack")?.length) {
				changes.push({
					key: "activities[attack].system.attack.flat",
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
					value: true
				});
				for (const activity of item.system.activities.byType("attack")) {
					const { parts, data } = buildRoll(
						{
							mod: this.actor.system.abilities?.[activity.ability]?.mod,
							prof: rollData.prof?.term,
							actorBonus: this.actor?.system.buildBonus?.(
								this.actor?.system.getModifiers?.({ ...activity.modifierData, class: this.modifierData.class }),
								{ rollData }
							)
						},
						rollData
					);
					changes.push({
						key: `system.activities.${activity.id}.system.attack.bonus`,
						mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
						value: simplifyFormula(Roll.replaceFormulaData(parts.join(" + "), data))
					});
				}
			}

			// Match saves
			if (this.system.match.saves && item.system.activities?.byType("save")?.length) {
				const dc =
					this.actor.system.spellcasting?.origins[this.item.system.associatedClass?.identifier]?.dc ??
					rollData.spellcasting?.dc ??
					8;
				changes.push(
					{
						key: "activities[save].system.save.dc.ability",
						mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
						value: "custom"
					},
					{
						key: "activities[save].system.save.dc.formula",
						mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
						value: dc
					}
				);
			}

			if (changes.length) {
				const effect = new ActiveEffect({
					_id: staticID("bfItemChanges"),
					changes,
					disabled: false,
					icon: "icons/skills/melee/strike-slashes-orange.webp",
					name: game.i18n.localize("BF.SUMMON.ItemChanges.Label"),
					origin: this.uuid,
					type: "enchantment"
				}).toObject();
				actorUpdates.items.push({ _id: item.id, effects: [effect] });
			}
		}

		// Add applied effects
		actorUpdates.effects.push(...this.system.effects.map(e => e.effect?.toObject()).filter(e => e));

		return { actorUpdates, tokenUpdates };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine where the summons should be placed on the scene.
	 * @param {PrototypeToken} token - Token to be placed.
	 * @param {SummonsProfile} profile - Profile used for summoning.
	 * @param {SummoningConfiguration} options - Additional summoning options.
	 * @returns {Promise<PlacementData[]>}
	 */
	async getPlacement(token, profile, options) {
		// Ensure the token matches the final size
		if (this.system.creatureSizes.size) {
			const size = this.system.creatureSizes.has(options.creatureSize)
				? options.creatureSize
				: this.system.creatureSizes.first();
			const config = CONFIG.BlackFlag.sizes[size];
			if (config) token = token.clone({ width: config.scale ?? 1, height: config.scale ?? 1 });
		}

		const rollData = this.getRollData();
		const count = new Roll(profile.count || "1", rollData);
		await count.evaluate();
		return TokenPlacement.place({ tokens: Array(parseInt(count.total)).fill(token) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Configuration for creating a modified token.
	 *
	 * @typedef {object} TokenUpdateData
	 * @property {BlackFlagActor} actor - Original actor from which the token will be created.
	 * @property {PlacementData} placement - Information on the location to summon the token.
	 * @property {object} tokenUpdates - Additional updates that will be applied to token data.
	 * @property {object} actorUpdates - Updates that will be applied to actor delta.
	 */

	/**
	 * Create token data ready to be summoned.
	 * @param {config} TokenUpdateData - Configuration for creating a modified token.
	 * @returns {object}
	 */
	async getTokenData({ actor, placement, tokenUpdates, actorUpdates }) {
		if (actor.prototypeToken.randomImg && !game.user.can("FILES_BROWSE")) {
			tokenUpdates.texture ??= {};
			tokenUpdates.texture.src ??= actor.img;
			ui.notifications.warn("BF.SUMMON.Warning.Wildcard", { localize: true });
		}

		delete placement.prototypeToken;
		const tokenDocument = await actor.getTokenDocument(foundry.utils.mergeObject(placement, tokenUpdates));

		// Linked summons require more explicit updates before token creation.
		// Unlinked summons can take actor delta directly.
		if (tokenDocument.actorLink) {
			const { effects, items, ...rest } = actorUpdates;
			await tokenDocument.actor.update(rest);
			await tokenDocument.actor.updateEmbeddedDocuments("Item", items);

			const { newEffects, oldEffects } = effects.reduce(
				(acc, curr) => {
					const target = tokenDocument.actor.effects.get(curr._id) ? "oldEffects" : "newEffects";
					acc[target].push(curr);
					return acc;
				},
				{ newEffects: [], oldEffects: [] }
			);

			await tokenDocument.actor.updateEmbeddedDocuments("ActiveEffect", oldEffects);
			await tokenDocument.actor.createEmbeddedDocuments("ActiveEffect", newEffects, { keepId: true });
		} else {
			tokenDocument.delta.updateSource(actorUpdates);
			if (actor.prototypeToken.appendNumber) TokenPlacement.adjustAppendedNumber(tokenDocument, placement);
		}

		return tokenDocument.toObject();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle placing a summons from the chat card.
	 * @this {SummonActivity}
	 * @param {PointerEvent} event - Triggering click event.
	 * @param {HTMLElement} target - The capturing HTML element which defined a [data-action].
	 * @param {BlackFlagChatMessage} message - Message associated with the activation.
	 */
	static async #placeSummons(event, target, message) {
		if (!canvas.scene) {
			ui.notifications.error("BF.SUMMON.Warning.NoScene", { localize: true });
			return;
		}

		const config = {
			create: { summons: true },
			summons: {}
		};
		let needsConfiguration = false;

		// No profile specified and only one profile on item, use that one
		const profiles = this.system.availableProfiles;
		if (profiles.length === 1) config.summons.profile = profiles[0]._id;
		else needsConfiguration = true;

		// More than one creature size or type requires configuration
		if (this.system.creatureSizes.size > 1 || this.system.creatureTypes.size > 1) needsConfiguration = true;

		if (needsConfiguration) {
			try {
				await SummonActivationDialog.create(this, config, {
					button: {
						icon: "fa-solid fa-spaghetti-monster-flying",
						label: "BF.SUMMON.Action.Summon"
					},
					display: {
						all: false,
						create: { summons: true }
					}
				});
			} catch (err) {
				return;
			}
		}

		try {
			await this.placeSummons(config.summons);
		} catch (err) {
			Hooks.onError("SummonsActivity#placeSummons", err, { log: "error", notify: "error" });
		}
	}
}
