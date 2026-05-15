/**
 * Generate an update object to remove any empty object keys.
 * @param {object} object - Object to be cleaned.
 * @returns {object} - Copy of object with only non false-ish values included and others marked
 *                     using `foundry.data.operators.ForcedDeletion` to be removed by update process.
 */
export function cleanedObjectUpdate(object) {
	return Object.entries(object).reduce((obj, [key, value]) => {
		let keep = false;
		if ( foundry.utils.getType(value) === "Object" ) keep = Object.values(value).some(v => v);
		else if ( value ) keep = true;
		if ( keep ) obj[key] = value;
		else obj[key] = _del;
		return obj;
	}, {});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Transform an object, returning only the keys which match the provided filter.
 * @param {object} obj - Object to transform.
 * @param {Function} [filter] - Filtering function. If none is provided, it will just check for truthiness.
 * @returns {string[]} - Array of filtered keys.
 */
export function filteredKeys(obj, filter) {
	filter ??= e => e;
	return Object.entries(obj).filter(e => filter(e[1])).map(e => e[0]);
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Flatten a configuration object with children into a single object. Final output will be ordered depth-first.
 * @param {SelectChoices|NestedTypeConfiguration} object - Nested object to flatten.
 * @param {object} [options={}]
 * @param {boolean|Function(object): boolean} [options.keepCategories=false] - Keep category listings in the final
 *                                                                             object or only entries that don't have
 *                                                                             children of their own.
 * @returns {object}
 */
export function flattenChildren(object, { keepCategories=false }={}) {
	const flattened = {};

	const makeFlat = level => {
		for ( const [key, value] of Object.entries(level) ) {
			const entry = foundry.utils.deepClone(value);
			const children = entry.children;
			delete entry.children;

			let keep;
			if ( !children ) keep = true;
			else if ( foundry.utils.getType(keepCategories) === "function" ) keep = keepCategories(entry);
			else keep = keepCategories;
			if ( keep ) flattened[key] = entry;

			if ( children ) makeFlat(children);
		}
	};
	makeFlat(object);

	return flattened;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Test if a given string is serialized JSON, and parse it if so.
 * @param {string} raw - The raw value.
 * @returns {any} - The parsed value, or the original value if it was not serialized JSON.
 */
export function parseOrString(raw) {
	try { return JSON.parse(raw); } catch(err) {}
	return raw;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Sort the provided object by its values or by an inner sortKey.
 * @param {object} obj - The object to sort.
 * @param {object} [options={}]
 * @param {boolean} [options.inPlace=false] - Sort the object as-is.
 * @param {boolean} [options.reverse=false] - Should the sorting be reversed?
 * @param {string|Function} [options.sortKey] - An inner key upon which to sort or sorting method.
 * @returns {object} - A copy of the original object that has been sorted.
 */
export function sortObjectEntries(obj, { inPlace=false, reverse=false, sortKey }={}) {
	let sorted = Object.entries(obj);
	const sort = (lhs, rhs) => foundry.utils.getType(lhs) === "string" ? lhs.localeCompare(rhs) : lhs - rhs;
	if ( foundry.utils.getType(sortKey) === "function" ) sorted = sorted.sort((lhs, rhs) => sortKey(lhs[1], rhs[1]));
	else if ( sortKey ) sorted = sorted.sort((lhs, rhs) => sort(lhs[1][sortKey], rhs[1][sortKey]));
	else sorted = sorted.sort((lhs, rhs) => sort(lhs[1], rhs[1]));
	if ( reverse ) sorted = sorted.reverse();
	if ( inPlace ) {
		Object.keys(obj).forEach(k => delete obj[k]);
		sorted.forEach(([k, v]) => obj[k] = v);
		return obj;
	}
	return Object.fromEntries(sorted);
}
