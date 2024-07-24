/**
 * Monkey-patch existing `DataField` types with active effect application methods. This is a temporary patch until
 * https://github.com/foundryvtt/foundryvtt/issues/6631 is implemented.
 */
export default function applyEffectApplicationPatches() {
	// Note: OVERRIDE and CUSTOM are always supported modes, _bfSupportedModes defines other modes that can be used
	const MODES = CONST.ACTIVE_EFFECT_MODES;
	const ALL = [MODES.MULTIPLY, MODES.ADD, MODES.DOWNGRADE, MODES.UPGRADE];

	foundry.data.fields.ArrayField._bfSupportedModes = [MODES.ADD];
	foundry.data.fields.BooleanField._bfSupportedModes = ALL;
	foundry.data.fields.DocumentIdField._bfSupportedModes = [];
	foundry.data.fields.FilePathField._bfSupportedModes = [];
	foundry.data.fields.NumberField._bfSupportedModes = ALL;
	foundry.data.fields.StringField._bfSupportedModes = [MODES.ADD];

	foundry.data.fields.SetField.prototype._applyChangeAdd = function (value, delta, model, change) {
		for (const element of delta) {
			const negative = element.replace(/^\s*-\s*/, "");
			if (negative !== element) value.delete(negative);
			else value.add(element);
		}
		return value;
	};
}
