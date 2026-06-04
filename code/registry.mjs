import DefaultMap from "./data/utility/default-map.mjs";

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                      Dependents                       */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

class DependentsRegistry {
	/**
	 * Registration of documents that are dependent on an active effect. The map is keyed by the UUID of
	 * the active effect upon which the document is dependent and contains a set of UUIDs for that effect's
	 * dependents. All UUIDs are expected to be world UUIDs or UUIDs of documents with the same ancestor
	 * document as the effect they are dependent on.
	 * @type {Map<string, Set<string>>}
	 */
	static #dependents = new Map();

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch dependent documents for an active effect.
	 * @param {ActiveEffect|string} effect - Active effect for which to get the dependent documents or UUID for an
	 *                                       effect in the world.
	 * @returns {Document[]}
	 */
	static get(effect) {
		effect = effect instanceof ActiveEffect ? effect : fromUuidSync(effect);
		return Array.from(this.#dependents.get(effect?.uuid) ?? [])
			.map(uuid => {
				// TODO: Remove this special casing once https://github.com/foundryvtt/foundryvtt/issues/11214 is resolved
				if (effect.parent.pack && uuid.includes(effect.parent.uuid)) {
					const [, embeddedName, id] = uuid.replace(effect.parent.uuid, "").split(".");
					return effect.parent.getEmbeddedDocument(embeddedName, id);
				}
				return fromUuidSync(uuid, { strict: false });
			})
			.filter(_ => _);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve an active effect ID into an absolute UUID.
	 * @param {string} idOrUuid - ID or UUID of active effect.
	 * @param {Document} dependent - Document to track as a dependent.
	 * @returns {string}
	 */
	static #resolveDependentID(idOrUuid, dependent) {
		if (idOrUuid.length > 16) return foundry.utils.parseUuid(idOrUuid, { relative: dependent })?.uuid;
		let relative = dependent.parent;
		if (relative && !(relative instanceof Item)) relative = relative.parent;
		return relative.effects.get(idOrUuid)?.uuid;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add a dependent document to the registry.
	 * @param {string} idOrUuid - ID or UUID of active effect.
	 * @param {Document} dependent - Document to track as a dependent.
	 */
	static track(idOrUuid, dependent) {
		const uuid = DependentsRegistry.#resolveDependentID(idOrUuid, dependent);
		if (!uuid) return;
		if (!DependentsRegistry.#dependents.has(uuid)) DependentsRegistry.#dependents.set(uuid, new Set());
		DependentsRegistry.#dependents.get(uuid).add(dependent.uuid);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove a dependent document from the registry.
	 * @param {string} idOrUuid - ID or UUID of active effect.
	 * @param {Document} dependent - Dependent document to stop tracking.
	 */
	static untrack(idOrUuid, dependent) {
		const uuid = DependentsRegistry.#resolveDependentID(idOrUuid, dependent);
		DependentsRegistry.#dependents.get(uuid)?.delete(dependent.uuid);
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                     Message Rolls                     */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

class MessageRegistry {
	/**
	 * Registration of roll chat messages that originated at a specific message. The map is keyed by the ID of
	 * the originating message and contains sets of IDs for each roll type.
	 * @type {Map<string, Map<string, Set<string>>}
	 */
	static #messages = new DefaultMap(() => new DefaultMap(() => new Set()));

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch roll messages for an origin message, in chronological order.
	 * @param {string} origin - ID of the origin message.
	 * @param {string} [type] - Type of roll messages to fetch.
	 * @returns {BlackFlagChatMessage[]}
	 */
	static get(origin, type) {
		if (!MessageRegistry.#messages.has(origin)) return [];
		const originMap = MessageRegistry.#messages.get(origin);
		let ids;
		if (type) ids = Array.from(originMap.get(type) ?? []);
		else
			ids = Array.from(originMap.values())
				.map(v => Array.from(v))
				.flat();
		return ids
			.map(id => game.messages.get(id))
			.filter(m => m)
			.sort((lhs, rhs) => lhs.timestamp - rhs.timestamp);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add a new roll message to the registry.
	 * @param {BlackFlagChatMessage} message - Message to add to the registry.
	 */
	static track(message) {
		const origin = message.getFlag(game.system.id, "originatingMessage");
		const type = message.getFlag(game.system.id, "roll.type");
		if (!origin || !type) return;
		MessageRegistry.#messages.get(origin).get(type).add(message.id);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove a roll message to the registry.
	 * @param {BlackFlagChatMessage} message - Message to remove from the registry.
	 */
	static untrack(message) {
		const origin = message.getFlag(game.system.id, "originatingMessage");
		const type = message.getFlag(game.system.id, "roll.type");
		MessageRegistry.#messages.get(origin).get(type).delete(message.id);
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                        Summons                        */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

class SummonRegistry {
	/**
	 * Registration of summoned creatures mapped to a specific summoner. The map is keyed by the UUID of
	 * summoner while the set contains UUID of actors that have been summoned.
	 * @type {Map<string, Set<string>>}
	 */
	static #creatures = new DefaultMap(() => new Set());

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch creatures summoned by an actor.
	 * @param {BlackFlagActor} actor - Actor for which to find the summoned creatures.
	 * @returns {BlackFlagActor[]}
	 */
	static creatures(actor) {
		if (!SummonRegistry.#creatures.has(actor.uuid)) return [];
		return Array.from(SummonRegistry.#creatures.get(actor.uuid)).map(uuid => fromUuidSync(uuid));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add a new summoned creature to the list of summoned creatures.
	 * @param {string} summoner - UUID of the actor who performed the summoning.
	 * @param {string} summoned - UUID of the summoned creature to track.
	 */
	static track(summoner, summoned) {
		if (summoned.startsWith("Compendium.")) return;
		SummonRegistry.#creatures.get(summoner).add(summoned);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Stop tracking a summoned creature.
	 * @param {string} summoner - UUID of the actor who performed the summoning.
	 * @param {string} summoned - UUID of the summoned creature to stop tracking.
	 */
	static untrack(summoner, summoned) {
		SummonRegistry.#creatures.get(summoner).delete(summoned);
	}
}

export default {
	dependents: DependentsRegistry,
	messages: MessageRegistry,
	summons: SummonRegistry
};
