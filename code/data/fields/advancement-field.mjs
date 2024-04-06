import BaseAdvancement from "../advancement/base-advancement.mjs";
import MappingField from "./mapping-field.mjs";
import TypeField from "./type-field.mjs";

/**
 * Field that automatically prepares advancements in an {@link AdvancementCollection}.
 */
export class AdvancementField extends MappingField {
	constructor(options) {
		super(
			new TypeField({
				determineType: value => value.type,
				modelLookup: type => CONFIG.Advancement.types[type]?.documentClass ?? null
			}),
			options
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static hierarchical = true;
	// TODO: Rework this to be more like EmbeddedCollection

	/* <><><><> <><><><> <><><><> <><><><> */

	initialize(value, model, options) {
		return new AdvancementCollection(model, super.initialize(value, model, options));
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Specialized collection type for retrieving advancement pseudo-documents.
 * @param {DataModel} model - The parent DataModel to which this AdvancementCollection belongs.
 * @param {Advancement[]} entries - Initialized advancement pseudo-documents.
 */
export class AdvancementCollection extends Collection {
	constructor(model, entries) {
		super();
		this.#model = model;
		for (const [id, entry] of Object.entries(entries)) {
			if (!(entry instanceof BaseAdvancement)) continue;
			this.set(id, entry);
			this.#types[entry.type] ??= [];
			this.#types[entry.type].push(entry);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The parent DataModel to which this AdvancementCollection instance belongs.
	 * @type {DataModel}
	 * @private
	 */
	#model;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Pre-filtered arrays of advancements per-type.
	 * @type {object}
	 * @private
	 */
	#types = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Cached store of advancements by level.
	 * @type {object}
	 * @private
	 */
	#_levels;

	/**
	 * Pre-filtered and -sorted arrays of advancements per-level.
	 * @type {object}
	 * @private
	 */
	get #levels() {
		if (!this.#_levels) {
			const levels = {};
			for (const advancement of this) {
				for (const level of advancement.levels) {
					levels[level] ??= [];
					levels[level].push(advancement);
				}
			}
			Object.entries(levels).forEach(([lvl, data]) =>
				data.sort((a, b) =>
					a
						.sortingValueForLevel({ character: Number(lvl), class: Number(lvl) })
						.localeCompare(b.sortingValueForLevel({ character: Number(lvl), class: Number(lvl) }))
				)
			);
			this.#_levels = levels;
		}
		return this.#_levels;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Levels represented by the advancements in this collection.
	 * @type {number[]}
	 */
	get levels() {
		return Object.keys(this.#levels).map(l => Number(l));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return array of advancements filtered by the provided type.
	 * @param {string} type
	 * @returns {Advancement[]}
	 */
	byType(type) {
		return this.#types[type] ?? [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return array of advancements filtered by level.
	 * @param {number} level
	 * @returns {Advancement[]}
	 */
	byLevel(level) {
		return this.#levels[level] ?? [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Convert the AdvancementCollection to an array of simple objects.
	 * @param {boolean} [source=true] - Draw data for contained Documents from the underlying data source?
	 * @returns {object[]} - The extracted array of primitive objects.
	 */
	toObject(source = true) {
		return this.map(doc => doc.toObject(source));
	}
}
