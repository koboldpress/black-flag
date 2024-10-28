import { staticID } from "../utils/_module.mjs";

/**
 * Extended version of `TokenDocument` class to support some system-specific functionality.
 */
export default class BlackFlagTokenDocument extends TokenDocument {
	async toggleActiveEffect(effectData, { overlay = false, active } = {}) {
		if (!this.actor || !effectData.id) return false;
		const id = staticID(`bf${effectData.id}`);

		// Remove existing effects matching this effect's static ID
		const existing = this.actor.effects.get(id);
		const state = active ?? !existing;
		if (!state && existing) await this.actor.deleteEmbeddedDocuments("ActiveEffect", [id]);
		// Add a new effect
		else if (state) {
			const cls = getDocumentClass("ActiveEffect");
			const effect = cls.fromStatusEffect(effectData);
			if (overlay) effect.updateSource({ "flags.core.overlay": true });
			await cls.create(effect, { parent: this.actor, keepId: true });
		}

		return state;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onDelete(options, userId) {
		super._onDelete(options, userId);
		const origin = this.actor?.getFlag(game.system.id, "summon.origin");
		if (origin) BlackFlag.registry.summons.untrack(origin.split(".Item.")[0], this.actor.uuid);
	}
}
