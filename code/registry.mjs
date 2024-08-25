/* -------------------------------------------- */
/*  Message Rolls                               */
/* -------------------------------------------- */

class MessageRegistry {
	/**
	 * Registration of roll chat messages that originated at a specific message. The map is keyed by the ID of
	 * the originating message and contains sets of IDs for each roll type.
	 * @type {Map<string, Map<string, Set<string>>}
	 */
	static #messages = new Map();

	/* -------------------------------------------- */

	/**
	 * Fetch roll messages for an origin message, in chronological order.
	 * @param {string} origin - ID of the origin message.
	 * @param {string} [type] - Type of roll messages to fetch.
	 * @returns {BlackFlagChatMessage[]}
	 */
	static messages(origin, type) {
		const originMap = MessageRegistry.#messages.get(origin);
		if (!originMap) return [];
		let ids;
		if (type) ids = Array.from(originMap.get(type)) ?? [];
		else
			ids = Array.from(originMap.values())
				.map(v => Array.from(v))
				.flat();
		return ids
			.map(id => game.messages.get(id))
			.filter(m => m)
			.sort((lhs, rhs) => lhs.timestamp - rhs.timestamp);
	}

	/* -------------------------------------------- */

	/**
	 * Add a new roll message to the registry.
	 * @param {BlackFlagChatMessage} message - Message to add to the registry.
	 */
	static track(message) {
		const origin = message.getFlag(game.system.id, "originatingMessage");
		const type = message.getFlag(game.system.id, "roll.type");
		if (!origin || !type) return;
		if (!MessageRegistry.#messages.has(origin)) MessageRegistry.#messages.set(origin, new Map());
		const originMap = MessageRegistry.#messages.get(origin);
		if (!originMap.has(type)) originMap.set(type, new Set());
		originMap.get(type).add(message.id);
	}

	/* -------------------------------------------- */

	/**
	 * Remove a roll message to the registry.
	 * @param {BlackFlagChatMessage} message - Message to remove from the registry.
	 */
	static untrack(message) {
		const origin = message.getFlag(game.system.id, "originatingMessage");
		const type = message.getFlag(game.system.id, "roll.type");
		MessageRegistry.#messages.get(origin)?.get(type)?.delete(message.id);
	}
}

export default {
	messages: MessageRegistry
};
