/**
 * Field that stores rolls as serialized JSON.
 */
export default class RollField extends foundry.data.fields.JSONField {
	initialize(value, model, options={}) {
		value = super.initialize(value, model, options);
		return value ? Roll.fromData(value) : value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	toObject(value) {
		if ( value instanceof Roll ) value = value.toJSON();
		return super.toObject(value);
	}
}
