import BaseActivity from "../activity/base-activity.mjs";
import MappingField from "./mapping-field.mjs";
import TypeField from "./type-field.mjs";

/**
 * Field that automatically prepares activities in an {@link ActivityCollection}.
 */
export class ActivityField extends MappingField {
	constructor(options) {
		super(
			new TypeField({
				determineType: value => value?.type,
				modelLookup: type => CONFIG.Activity.types[type]?.documentClass ?? null
			}),
			options
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static hierarchical = true;
	// TODO: Rework this to be more like EmbeddedCollection

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	initialize(value, model, options) {
		return new ActivityCollection(model, super.initialize(value, model, options));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	migrateSource(sourceData, fieldData) {
		for (const value of Object.values(fieldData ?? {})) {
			this.model.migrateSource(sourceData, value);
		}
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Specialized collection type for retrieving activity PseudoDocuments.
 * @param {DataModel} model - The parent DataModel to which this ActivityCollection belongs.
 * @param {Activity[]} entries - Initialized advancement PseudoDocuments.
 */
export class ActivityCollection extends Collection {
	constructor(model, entries) {
		super();
		this.#model = model;
		const activities = Object.entries(entries).sort(
			(lhs, rhs) => (lhs[1].sort ?? Infinity) - (rhs[1].sort ?? Infinity)
		);
		for (const [id, entry] of activities) {
			if (!(entry instanceof BaseActivity)) continue;
			this.set(id, entry);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The parent DataModel to which this ActivityCollection instance belongs.
	 * @type {DataModel}
	 */
	#model;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-filtered arrays of activities per-type.
	 * @type {Map<string, Set<string>>}
	 */
	#types = new Map();

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Methods               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return array of activities filtered by the provided type.
	 * @param {string} type
	 * @returns {Activity[]}
	 * @deprecated
	 */
	byType(type) {
		return this.getByType(type);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return array of activities filtered by the provided type.
	 * @param {string} type
	 * @returns {Activity[]}
	 */
	getByType(type) {
		return Array.from(this.#types.get(type) ?? []).map(key => this.get(key));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generator that yields activities for each of the provided types.
	 * @param {string[]} types - Types to fetch.
	 * @yields {Activity}
	 */
	*getByTypes(...types) {
		for (const type of types) {
			for (const activity of this.getByType(type)) yield activity;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	set(key, value) {
		if (!this.#types.has(value.type)) this.#types.set(value.type, new Set());
		this.#types.get(value.type).add(key);
		return super.set(key, value);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	delete(key) {
		this.#types.get(this.get(key)?.type)?.delete(key);
		return super.delete(key);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Test the given predicate against every entry in the Collection.
	 * @param {function(*, number, ActivityCollection): boolean} predicate - The predicate.
	 * @returns {boolean}
	 */
	every(predicate) {
		return this.reduce((pass, v, i) => pass && predicate(v, i, this), true);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Convert the ActivityCollection to an array of simple objects.
	 * @param {boolean} [source=true] - Draw data for contained Documents from the underlying data source?
	 * @returns {object[]} - The extracted array of primitive objects.
	 */
	toObject(source = true) {
		return this.map(doc => doc.toObject(source));
	}
}
