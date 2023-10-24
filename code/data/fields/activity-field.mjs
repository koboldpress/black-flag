import BaseActivity from "../activity/base-activity.mjs";
import MappingField from "./mapping-field.mjs";
import TypeField from "./type-field.mjs";

/**
 * Field that automatically prepares activities in an {@link ActivityCollection}.
 */
export class ActivityField extends MappingField {
	constructor(options) {
		super(new TypeField({
			determineType: value => value.type,
			modelLookup: type => CONFIG.Activity.types[type]?.documentClass ?? null
		}), options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static hierarchical = true;
	// TODO: Rework this to be more like EmbeddedCollection

	/* <><><><> <><><><> <><><><> <><><><> */

	initialize(value, model, options) {
		return new ActivityCollection(model, super.initialize(value, model, options));
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
		for ( const [id, entry] of Object.entries(entries) ) {
			if ( !(entry instanceof BaseActivity) ) continue;
			this.set(id, entry);
			this.#types[entry.type] ??= [];
			this.#types[entry.type].push(entry);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The parent DataModel to which this ActivityCollection instance belongs.
	 * @type {DataModel}
	 * @private
	 */
	#model;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-filtered arrays of activities per-type.
	 * @type {object}
	 * @private
	 */
	#types = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return array of activities filtered by the provided type.
	 * @param {string} type
	 * @returns {Activity[]}
	 */
	byType(type) {
		return this.#types[type] ?? [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Convert the ActivityCollection to an array of simple objects.
	 * @param {boolean} [source=true] - Draw data for contained Documents from the underlying data source?
	 * @returns {object[]} - The extracted array of primitive objects.
	 */
	toObject(source=true) {
		return this.map(doc => doc.toObject(source));
	}
}
