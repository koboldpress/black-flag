/**
 * Extended version of `TokenDocument` class to support some system-specific functionality.
 */
export default class BlackFlagTokenDocument extends TokenDocument {
	async toggleActiveEffect(effectData, {overlay=false, active}={}) {
		if ( !this.actor || !effectData.id ) return false;

		// Remove an existing effect
		const existing = this.actor.effects.reduce((arr, e) => {
			if ( (e.statuses.size === 1) && e.statuses.has(effectData.id) ) arr.push(e.id);
			return arr;
		}, []);
		const state = active ?? !existing.length;
		if ( !state && existing.length ) {
			await this.actor.deleteEmbeddedDocuments("ActiveEffect", existing);
		}

		// Add a new effect
		else if ( state ) {
			const cls = getDocumentClass("ActiveEffect");
			const condition = CONFIG.BlackFlag.registration.get("condition", effectData.id);
			let createData;
			if ( condition ) {
				const conditionDocument = condition.cached;
				createData = conditionDocument.system.levels[0]?.effect?.toObject();
			} else {
				createData = foundry.utils.deepClone(effectData);
				createData.name = game.i18n.localize(effectData.name);
				createData.statuses = [effectData.id];
			}
			if ( overlay ) createData["flags.core.overlay"] = true;
			delete createData.id;
			await cls.create(createData, {parent: this.actor});
		}
		return state;
	}
}
