/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 */
export default class BlackFlagActiveEffect extends ActiveEffect {

	_applyAdd(actor, change, current, delta, changes) {
		if ( current instanceof Set ) {
			if ( Array.isArray(delta) ) delta.forEach(item => current.add(item));
			else current.add(delta);
			return;
		}
		super._applyAdd(actor, change, current, delta, changes);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_applyOverride(actor, change, current, delta, changes) {
		if ( current instanceof Set ) {
			current.clear();
			if ( Array.isArray(delta) ) delta.forEach(item => current.add(item));
			else current.add(delta);
			return;
		}
		return super._applyOverride(actor, change, current, delta, changes);
	}
}
