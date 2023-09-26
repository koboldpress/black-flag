/**
 * Generate an update object to remove any empty object keys.
 * @param {object} object - Object to be cleaned.
 * @returns {object} - Copy of object with only non false-ish values included and others marked
 *                     using `-=` syntax to be removed by update process.
 */
export function cleanedObjectUpdate(object) {
	return Object.entries(object).reduce((obj, [key, value]) => {
		if ( value ) obj[key] = value;
		else obj[`-=${key}`] = null;
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
 * Sort the provided object by its values or by an inner sortKey.
 * @param {object} obj - The object to sort.
 * @param {string|Function} [sortKey] - An inner key upon which to sort or sorting method.
 * @returns {object} - A copy of the original object that has been sorted.
 */
export function sortObjectEntries(obj, sortKey) {
	let sorted = Object.entries(obj);
	const sort = (lhs, rhs) => foundry.utils.getType(lhs) === "string" ? lhs.localeCompare(rhs) : lhs - rhs;
	if ( foundry.utils.getType(sortKey) === "function" ) sorted = sorted.sort((lhs, rhs) => sortKey(lhs[1], rhs[1]));
	else if ( sortKey ) sorted = sorted.sort((lhs, rhs) => sort(lhs[1][sortKey], rhs[1][sortKey]));
	else sorted = sorted.sort((lhs, rhs) => sort(lhs[1], rhs[1]));
	return Object.fromEntries(sorted);
}
