const { DocumentIdField, SchemaField } = foundry.data.fields;

/**
 * Data for effects that can be applied.
 *
 * @typedef {object} EffectApplicationData
 * @property {string} _id  ID of the effect to apply.
 */

/**
 * Field for storing an active effects applied by an activity.
 *
 * @property {string} _id  ID of the effect to apply.
 */
export default class AppliedEffectField extends SchemaField {
	constructor(fields = {}, options = {}) {
		super(
			{
				_id: new DocumentIdField(),
				...fields
			},
			options
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		const obj = super.initialize(value, model, options);
		const item = model.parent.item;

		Object.defineProperty(obj, "effect", {
			get() {
				return item?.effects.get(this._id);
			},
			configurable: true
		});

		return obj;
	}
}
