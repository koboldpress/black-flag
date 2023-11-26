/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 */
export default class BlackFlagActiveEffect extends ActiveEffect {

	apply(document, change) {
		// Grab DataField instance for target, if not found, fallback on default Foundry implementation
		const keyPath = change.key.replace("system.", "");
		const field = document.system.schema.getField(keyPath);
		if ( !change.key.startsWith("system.") || !field ) return super.apply(document, change);

		// Get the current value of the target field
		const current = foundry.utils.getProperty(document, change.key) ?? null;

		// Convert input using field's _bfCastEffectValue if it exists
		let delta;
		try {
			delta = field._bfCastDelta(this._parseOrString(change.value));
			field._bfValidateDelta(delta);
		} catch(err) {
			console.warn(
				`Actor ${document.name} [${document.id}] | Unable to parse active effect change `
				+ `for %c${change.key}%c "${change.value}": %c${err.message}`,
				"color: blue", "", "color: crimson"
			);
			return;
		}

		const MODES = CONST.ACTIVE_EFFECT_MODES;
		const changes = {};
		switch ( change.mode ) {
			case MODES.ADD:
				field._bfApplyAdd(document, change, current, delta, changes);
				break;
			case MODES.MULTIPLY:
				field._bfApplyMultiply(document, change, current, delta, changes);
				break;
			case MODES.OVERRIDE:
				field._bfApplyOverride(document, change, current, delta, changes);
				break;
			case MODES.UPGRADE:
				field._bfApplyUpgrade(document, change, current, delta, changes);
				break;
			case MODES.DOWNGRADE:
				field._bfApplyDowngrade(document, change, current, delta, changes);
				break;
			default:
				this._applyCustom(document, change, current, delta, changes);
				break;
		}

		// Apply all changes to the Document data
		foundry.utils.mergeObject(document, changes);
		return changes;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_parseOrString(raw) {
		if ( raw instanceof foundry.abstract.DataModel ) return raw;
		return super._parseOrString(raw);
	}
}
