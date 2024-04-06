/**
 * Monkey-patch existing `DataField` types with active effect application methods. This is a temporary patch until
 * https://github.com/foundryvtt/foundryvtt/issues/6631 is implemented.
 */
export default function applyEffectApplicationPatches() {
	// Note: OVERRIDE and CUSTOM are always supported modes, _bfSupportedModes defines other modes that can be used
	const MODES = CONST.ACTIVE_EFFECT_MODES;
	const ALL = [MODES.MULTIPLY, MODES.ADD, MODES.DOWNGRADE, MODES.UPGRADE];
	let field;

	// DataField
	field = foundry.data.fields.DataField;
	field._bfSupportedModes = [];
	field.prototype._bfApplyAdd = function (document, change, current, delta, changes) {};
	field.prototype._bfApplyMultiply = function (document, change, current, delta, changes) {};
	field.prototype._bfApplyUpgrade = function (document, change, current, delta, changes) {};
	field.prototype._bfApplyDowngrade = function (document, change, current, delta, changes) {};
	field.prototype._bfApplyOverride = function (document, change, current, delta, changes) {
		changes[change.key] = delta;
	};
	field.prototype._bfCastDelta = function (value) {
		return this._cast(value);
	};
	field.prototype._bfValidateDelta = function (value) {
		return this._validateType(value);
	};

	// ArrayField
	field = foundry.data.fields.ArrayField;
	field._bfSupportedModes = [MODES.ADD];
	field.prototype._bfApplyAdd = function (document, change, current, delta, changes) {
		changes[change.key] = current.concat(delta);
	};
	field.prototype._bfCastArray = function (raw) {
		const delta = raw instanceof Array ? raw : [raw];
		return delta.map(e => this.element._bfCastDelta(e));
	};
	field.prototype._bfCastDelta = function (value) {
		return this._bfCastArray(value);
	};

	// BooleanField
	field = foundry.data.fields.BooleanField;
	field._bfSupportedModes = [MODES.DOWNGRADE, MODES.UPGRADE];
	field.prototype._bfApplyUpgrade = function (document, change, current, delta, changes) {
		if (current === null || current === undefined || delta > current) changes[change.key] = delta;
	};
	field.prototype._bfApplyDowngrade = function (document, change, current, delta, changes) {
		if (current === null || current === undefined || delta < current) changes[change.key] = delta;
	};

	// NumberField
	field = foundry.data.fields.NumberField;
	field._bfSupportedModes = ALL;
	field.prototype._bfApplyAdd = function (document, change, current, delta, changes) {
		changes[change.key] = current + delta;
	};
	field.prototype._bfApplyMultiply = function (document, change, current, delta, changes) {
		changes[change.key] = current * delta;
	};
	field.prototype._bfApplyUpgrade = function (document, change, current, delta, changes) {
		if (current === null || current === undefined || delta > current) changes[change.key] = delta;
	};
	field.prototype._bfApplyDowngrade = function (document, change, current, delta, changes) {
		if (current === null || current === undefined || delta < current) changes[change.key] = delta;
	};

	// SetField
	field = foundry.data.fields.SetField;
	field.prototype._bfApplyAdd = function (document, change, current, delta, changes) {
		changes[change.key] = current;
		delta.forEach(e => changes[change.key].add(e));
	};
	field.prototype._bfApplyOverride = function (document, change, current, delta, changes) {
		changes[change.key] = new Set();
		delta.forEach(e => changes[change.key].add(e));
	};

	// StringField
	field = foundry.data.fields.StringField;
	field._bfSupportedModes = [MODES.ADD];
	field.prototype._bfApplyAdd = function (document, change, current, delta, changes) {
		changes[change.key] = current + delta;
	};

	// ColorField
	// TODO: Probably some fancy color merging that can be done here

	// Set of string fields that shouldn't support ADD mode
	foundry.data.fields.DocumentIdField._bfSupportedModes = [];
	foundry.data.fields.FilePathField._bfSupportedModes = [];

	// JSONField
	// TODO: Probably deserialize the data and then treat it as an ObjectField
}
