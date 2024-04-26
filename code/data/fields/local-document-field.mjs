/**
 * A mirror of ForeignDocumentField that references a Document embedded within this Document.
 *
 * @param {typeof Document} model - The local DataModel class definition which this field should link to.
 * @param {StringFieldOptions} options - Options which configure the behavior of the field.
 */
export default class LocalDocumentField extends foundry.data.fields.DocumentIdField {
	constructor(model, options = {}) {
		if (!foundry.utils.isSubclass(model, foundry.abstract.DataModel)) {
			throw new Error("A LocalDocumentField must specify a DataModel subclass as its type");
		}

		super(options);
		this.model = model;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A reference to the model class which is stored in this field.
	 * @type {typeof Document}
	 */
	model;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get _defaults() {
		return foundry.utils.mergeObject(super._defaults, {
			nullable: true,
			readonly: false,
			idOnly: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_cast(value) {
		if (typeof value === "string") return value;
		if (value instanceof this.model) return value._id;
		throw new Error(`The value provided to a LocalDocumentField must be a ${this.model.name} instance.`);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Step up through model's parents to find the specified collection.
	 * @param {DataModel} model
	 * @param {string} collection
	 * @returns {EmbeddedCollection|void}
	 */
	_findCollection(model, collection) {
		if (!model.parent) return;
		return model.parent[collection] ?? this._findCollection(model.parent, collection);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	initialize(value, model, options = {}) {
		if (this.idOnly) return value;
		const collection = this._findCollection(model, this.model.metadata.collection);
		return () => collection?.get(value) ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	toObject(value) {
		return value?._id ?? value;
	}
}
