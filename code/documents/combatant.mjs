import ActivationsField from "../data/chat-message/fields/activations-field.mjs";
import ActorDeltasField from "../data/chat-message/fields/deltas-field.mjs";

/**
 * @import { ActorDeltasData } from "../data/chat-message/fields/deltas-field.mjs";
 */

/**
 * @typedef CombatRecoveryResults
 * @property {object} actor - Updates to be applied to the actor.
 * @property {object[]} item - Updates to be applied to the actor's items.
 * @property {BasicRoll[]} rolls - Any recovery rolls performed.
 */

/**
 * Extended version of `Combatant` class to support initiative rolls.
 */
export default class BlackFlagCombatant extends Combatant {
	/**
	 * Create a chat message representing actor changes and displaying possible actions for this turn.
	 * @param {object} [data={}]
	 * @param {ActorDeltasData} [data.deltas]
	 * @param {string[]} [data.periods]
	 * @param {BasicRoll[]} [data.rolls]
	 * @returns {BlackFlagChatMessage|void}
	 */
	async createTurnMessage({ deltas, periods, rolls } = {}) {
		const messageConfig = {
			create: false,
			data: {
				rolls,
				speaker: ChatMessage.getSpeaker({ actor: this.actor, token: this.token }),
				system: {
					deltas,
					periods,
					activations: ActivationsField.getActivations(this.actor, periods),
					origin: {
						combat: this.combat.id,
						combatant: this.id
					}
				},
				type: "turn",
				whisper: game.users.filter(u => this.actor.testUserPermission(u, "OWNER"))
			}
		};

		if (
			!foundry.utils.isEmpty(messageConfig.data.system.deltas?.actor) ||
			!foundry.utils.isEmpty(messageConfig.data.system.deltas?.item) ||
			!foundry.utils.isEmpty(messageConfig.data.system.activations)
		)
			messageConfig.create = true;

		/**
		 * A hook event that fires before a combat state change chat message is created.
		 * @function blackFlag.preCreateCombatMessage
		 * @memberof hookEvents
		 * @param {BlackFlagCombatant} combatant - Combatant for which the message will be created.
		 * @param {object} messageConfig
		 * @param {boolean} messageConfig.create - Should the chat message be posted?
		 * @param {object} messageConfig.data - Data for the created chat message.
		 */
		Hooks.callAll("blackFlag.preCreateCombatMessage", this, messageConfig);

		if (messageConfig.create) return ChatMessage.implementation.create(messageConfig.data);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getInitiativeRoll(formula) {
		if (formula) return super.getInitiativeRoll(formula);
		if (this.actor?._cachedInitiativeRolls?.[0]) return this.actor._cachedInitiativeRolls[0].clone();
		const config = this.actor?.getInitiativeRollConfig() ?? {};
		if (config.fixed !== undefined) return new CONFIG.Dice.BasicRoll(`${config.fixed}`);
		return CONFIG.Dice.ChallengeRoll.fromConfig(config.rolls[0]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reset combat-related uses.
	 * @param {string[]} periods - Which recovery periods should be considered.
	 * @returns {Promise<BlackFlagCombatant>}
	 */
	async recoverCombatUses(periods) {
		/**
		 * A hook event that fires before combat-related recovery changes.
		 * @function blackFlag.preCombatRecovery
		 * @memberof hookEvents
		 * @param {BlackFlagCombatant} combatant - Combatant that is being recovered.
		 * @param {string[]} periods - Periods to be recovered.
		 * @returns {boolean} - Explicitly return `false` to prevent recovery from being performed.
		 */
		if (Hooks.call("blackFlag.preCombatRecovery", this, periods) === false) return;

		const results = { actor: {}, item: [], rolls: [] };
		await this.actor?.system.recoverCombatUses?.(periods, results);

		for (const item of this.actor?.items ?? []) {
			if (foundry.utils.getType(item.system.recoverUses) !== "function") continue;
			const rollData = item.getRollData();
			const { updates, rolls } = await item.system.recoverUses(periods, rollData);
			if (!foundry.utils.isEmpty(updates)) {
				const updateTarget = results.item.find(i => i._id === item.id);
				if (updateTarget) foundry.utils.mergeObject(updateTarget, updates);
				else results.item.push({ _id: item.id, ...updates });
			}
			results.rolls.push(...rolls);
		}

		/**
		 * A hook event that fires after combat-related recovery changes have been prepared, but before they have been
		 * applied to the actor.
		 * @function blackFlag.combatRecovery
		 * @memberof hookEvents
		 * @param {BlackFlagCombatant} combatant - Combatant that is being recovered.
		 * @param {string[]} periods - Periods that were recovered.
		 * @param {CombatRecoveryResults} results - Update that will be applied to the actor and its items.
		 * @returns {boolean} - Explicitly return `false` to prevent updates from being performed.
		 */
		if (Hooks.call("blackFlag.combatRecovery", this, periods, results) === false) return;

		const deltas = ActorDeltasField.getDeltas(this.actor, results);

		if (!foundry.utils.isEmpty(results.actor)) await this.actor.update(results.actor);
		if (results.item.length) await this.actor.updateEmbeddedDocuments("Item", results.item);

		const message = await this.createTurnMessage({ deltas, periods, rolls: results.rolls });

		/**
		 * A hook event that fires after combat-related recovery changes have been applied.
		 * @function blackFlag.postCombatRecovery
		 * @memberof hookEvents
		 * @param {BlackFlagCombatant} combatant - Combatant that is being recovered.
		 * @param {string[]} periods - Periods that were recovered.
		 * @param {ChatMessage5e|void} message - Chat message created, if any.
		 */
		Hooks.callAll("blackFlag.postCombatRecovery", this, periods, message);
	}
}
