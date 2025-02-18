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
				determineType: value => value?.type,
				modelLookup: type => CONFIG.Advancement.types[type]?.documentClass ?? null
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
		return new AdvancementCollection(model, super.initialize(value, model, options));
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
			if (!this.#types.has(entry.type)) this.#types.set(entry.type, []);
			this.#types.get(entry.type).push(entry);
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
	 * @type {Map<string, Advancement[]>}
	 * @private
	 */
	#types = new Map();

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Cached store of advancements by level.
	 * @type {Map<string, Advancement[]>}
	 * @private
	 */
	#_levels;

	/**
	 * Pre-filtered and -sorted arrays of advancements per-level.
	 * @type {Map<string, Advancement[]>}
	 * @private
	 */
	get #levels() {
		if (!this.#_levels) {
			this.#_levels = new Map();
			for (const advancement of this) {
				for (const level of advancement.levels) {
					if (!this.#_levels.has(level)) this.#_levels.set(level, []);
					this.#_levels.get(level).push(advancement);
				}
			}
			for (let [level, data] of this.#_levels.entries()) {
				const levelData = { character: Number(level), class: Number(level) };
				data.sort((a, b) => a.sortingValueForLevel(levelData).localeCompare(b.sortingValueForLevel(levelData)));
			}
		}
		return this.#_levels;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Levels represented by the advancements in this collection.
	 * @type {number[]}
	 */
	get levels() {
		return Array.from(this.#levels.keys()).map(l => Number(l));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Cached store of like advancement types.
	 * @type {Map<string, string[]>}
	 * @private
	 */
	static #_like;

	/**
	 * Relationship between base types and types like them.
	 * @type {Map<string, string[]>}
	 * @private
	 */
	static get #like() {
		if (!this.#_like) {
			this.#_like = new Map();
			for (const [type, config] of Object.entries(CONFIG.Advancement.types)) {
				const like = config.documentClass?.metadata?.like;
				if (like) {
					if (!this.#_like.has(like)) this.#_like.set(like, []);
					this.#_like.get(like).push(type);
				}
			}
		}
		return this.#_like;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return array of advancements filtered by the provided type.
	 * @param {string} type
	 * @returns {Advancement[]}
	 */
	byType(type) {
		return [
			...(this.#types.get(type) ?? []),
			...(this.constructor.#like.get(type) ?? []).flatMap(t => this.#types.get(t) ?? [])
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return array of advancements filtered by level.
	 * @param {number} level
	 * @returns {Advancement[]}
	 */
	byLevel(level) {
		return this.#levels.get(level) ?? [];
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
