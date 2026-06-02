const { DocumentIdField, NumberField, SchemaField } = foundry.data.fields;

/**
 * Data for effects that can be applied.
 *
 * @typedef {object} EffectApplicationData
 * @property {string} _id - ID of the effect to apply.
 * @property {object} level
 * @property {number} level.min - Minimum level at which this effect can be applied.
 * @property {number} level.max - Maximum level at which this effect can be applied.
 */

/**
 * Field for storing an active effects applied by an activity.
 */
export default class AppliedEffectField extends SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			_id: new DocumentIdField(),
			level: new SchemaField({
				min: new NumberField({ min: 0, integer: true }),
				max: new NumberField({ min: 0, integer: true })
			}),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, options);
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
