import { sortObjectEntries } from "../utils/object.mjs";

/**
 * Object representing a nested set of choices to be displayed in a grouped select list or a trait selector.
 *
 * @typedef {object} SelectChoicesEntry
 * @property {string} label - Label, either pre- or post-localized.
 * @property {boolean} [chosen] - Has this choice been selected?
 * @property {boolean} [sorting=true] - Should this value be sorted? If there are a mixture of this value at
 *                                      a level, unsorted values are listed first followed by sorted values.
 * @property {SelectChoices} [children] - Nested choices.
 */

/**
 * Object with a number of methods for performing actions on a nested set of choices.
 *
 * @param {{[key: string]: SelectChoicesEntry}} [choices={}] - Initial choices for the object.
 */
export default class SelectChoices {
	constructor(choices={}) {
		const clone = foundry.utils.deepClone(choices);
		for ( const value of Object.values(clone) ) {
			if ( !value.children || (value.children instanceof SelectChoices) ) continue;
			value.category = true;
			value.children = new this.constructor(value.children);
		}
		Object.assign(this, clone);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a set of available choice keys.
	 * @type {Set<string>}
	 */
	get set() {
		const set = new Set();
		for ( const [key, choice] of Object.entries(this) ) {
			if ( !choice.children ) set.add(key);
			else {
				if ( choice.selectableCategory ) set.add(`${key}!`);
				choice.children.set.forEach(k => set.add(k));
			}
		}
		return set;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Retrieve a value for the specific key.
	 * @param {string} key
	 * @returns {object}
	 */
	get(key) {
		const search = (data, key) => {
			for ( const [k, v] of Object.entries(data) ) {
				if ( k === key ) return v;
				if ( v.children ) {
					const result = search(v.children, key);
					if ( result ) return result;
				}
			}
		};
		return search(this, key);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a clone of this object.
	 * @returns {SelectChoices}
	 */
	clone() {
		const newData = {};
		for ( const [key, value] of Object.entries(this) ) {
			newData[key] = foundry.utils.deepClone(value);
			if ( value.children ) newData[key].children = value.children.clone();
		}
		const clone = new this.constructor(newData);
		return clone;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Find key and value for the provided key or key suffix.
	 * @param {string} key - Full prefixed key (e.g. `tool:art:alchemist`) or just the suffix (e.g. `alchemist`).
	 * @returns {[string, SelectChoicesEntry]|null} - An tuple with the first value being the matched key,
	 *                                                and the second being the value.
	 */
	find(key) {
		for ( const [k, v] of Object.entries(this) ) {
			if ( (k === key) || k.endsWith(`:${key}`) ) {
				return [k, v];
			} else if ( v.children ) {
				const result = v.children.find(key);
				if ( result ) return result;
			}
		}
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Merge another SelectOptions object into this one.
	 * @param {SelectOptions} other
	 * @returns {SelectOptions}
	 */
	merge(other) {
		return foundry.utils.mergeObject(this, other);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Merge another SelectOptions object into this one, returning a new SelectOptions object.
	 * @param {SelectOptions} other
	 * @returns {SelectOptions}
	 */
	merged(other) {
		return this.clone().merge(other);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Internal sorting method.
	 * @param {object} lhs
	 * @param {object} rhs
	 * @returns {number}
	 */
	_sort(lhs, rhs) {
		if ( lhs.sorting === false && rhs.sorting === false ) return 0;
		if ( lhs.sorting === false ) return -1;
		if ( rhs.sorting === false ) return 1;
		return lhs.label.localeCompare(rhs.label);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort the entries using the label.
	 * @returns {SelectOptions}
	 */
	sort() {
		const sorted = new SelectChoices(sortObjectEntries(this, { sortKey: this._sort }));
		for ( const key of Object.keys(this) ) delete this[key];
		this.merge(sorted);
		for ( const entry of Object.values(this) ) {
			if ( entry.children ) entry.children.sort();
		}
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort the entries using the label, returning a new SelectOptions object.
	 * @returns {SelectOptions}
	 */
	sorted() {
		const sorted = new SelectChoices(sortObjectEntries(this, { sortKey: this._sort }));
		for ( const entry of Object.values(sorted) ) {
			if ( entry.children ) entry.children = entry.children.sorted();
		}
		return sorted;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Filters choices in place to only include the provided keys.
	 * @param {Set<string>|SelectChoices} filter - Keys of traits to retain or another SelectOptions object.
	 * @returns {SelectChoices} - This SelectChoices with filter applied.
	 */
	filter(filter) {
		if ( filter instanceof SelectChoices ) filter = filter.set;

		for ( const [key, trait] of Object.entries(this) ) {
			// Simple filter ("languages:standard:common") - Include this entry
			// Category filter ("tools:artisan") - Include category but not children
			const wildcardKey = key.replace(/(:|^)([\w]+)$/, "$1*");
			const forcedCategoryKey = `${key}!`;
			if ( filter.has(key) && !filter.has(wildcardKey) ) {
				if ( trait.children ) {
					if ( filter.has(forcedCategoryKey) ) {
						trait.children.filter(filter);
						if ( foundry.utils.isEmpty(trait.children) ) delete trait.children;
					} else delete trait.children;
				}
			}

			// Check children, remove entry if no children match filter
			else if ( !filter.has(wildcardKey) && !filter.has(`${key}:*`) ) {
				if ( trait.children ) trait.children.filter(filter);
				if ( foundry.utils.isEmpty(trait.children ?? {}) ) delete this[key];
			}

			// Top-level wildcard ("languages:*") - Include all entries & children
			// Category wildcard ("tools:artisan:*") - Include category and all children
		}

		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Filters choices to only include the provided keys, returning a new SelectChoices object.
	 * @param {Set<string>|SelectChoices} filter - Keys of traits to retain or another SelectOptions object.
	 * @returns {SelectChoices} - Clone of SelectChoices with filter applied.
	 */
	filtered(filter) {
		return this.clone().filter(filter);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Removes in place any traits or categories the keys of which are included in the exclusion set.
	 * @param {Set<string>} keys - Set of keys to remove from the choices.
	 * @returns {SelectChoices} - This SelectChoices with excluded keys removed.
	 */
	exclude(keys) {
		for ( const [key, trait] of Object.entries(this) ) {
			// TODO: Handle wildcard keys
			if ( keys.has(key) ) delete this[key];
			else if ( trait.children ) trait.children = trait.children.exclude(keys);
		}
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Removes any traits or categories the keys of which are included in the exclusion set, returning a copy.
	 * @param {Set<string>} keys - Set of keys to remove from the choices.
	 * @returns {SelectChoices} - Clone of SelectChoices with excluded keys removed.
	 */
	excluded(keys) {
		return this.clone().exclude(keys);
	}
}
