/**
 * @typedef {DataFieldOptions} TypeFieldOptions
 * @property {TypeFieldTypeGetter} [determineType] - Function used to determine the type.
 * @property {TypeFieldModelGetter|object} [modelLookup] - Function or object that loads the model based on type.
 */

/**
 * Data field that selects the appropriate data model if available, otherwise defaults to generic
 * `ObjectField` to prevent issues with custom types that aren't currently loaded.
 *
 * @param {TypeFieldOptions} [options={}]
 * @property {TypeFieldTypeGetter} [determineType] - Function used to determine the type.
 * @property {TypeFieldModelGetter|object} [modelLookup] - Function or object that loads the model based on type.
 */
export default class TypeField extends foundry.data.fields.ObjectField {
	/** @inheritDoc */
	static get _defaults() {
		return foundry.utils.mergeObject(super._defaults, {
			determineType: null,
			modelLookup: null
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static recursive = true;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the DataModel definition for the specified type.
	 * @param {object} value - Data being prepared for this field.
	 * @param {DataField} parent - Parent field for which this is being prepared.
	 * @returns {typeof DataModel|null} - Data model to use while initializing the field.
	 */
	getModel(value, parent) {
		const type = this.determineType?.(value, parent) ?? null;
		if (foundry.utils.getType(this.modelLookup) === "function") return this.modelLookup(type) ?? null;
		return this.modelLookup?.[type] ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_cleanType(value, options) {
		if (!(typeof value === "object")) value = {};

		const cls = this.getModel(value);
		if (cls) return cls.cleanData(value, options);
		return value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	initialize(value, model, options = {}) {
		const cls = this.getModel(value, model);
		if (cls) {
			const created = cls.fromSource(value, { parent: model, ...options });
			if (created.schema) created.schema.name = this.name;
			return created;
		}
		return foundry.utils.deepClone(value);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate this field's candidate source data.
	 * @param {object} sourceData - Candidate source data of the root model.
	 * @param {any} fieldData - The value of this field within the source data.
	 */
	migrateSource(sourceData, fieldData) {
		const cls = this.getModel(fieldData, sourceData);
		if (cls) cls.migrateDataSafe(fieldData);
	}
}
