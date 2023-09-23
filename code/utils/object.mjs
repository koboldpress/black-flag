/**
 * Transform an object, returning only the keys which match the provided filter.
 * @param {object} obj - Object to transform.
 * @param {Function} [filter] - Filtering function. If none is provided, it will just check for truthiness.
 * @returns {string[]} - Array of filtered keys.
 */
export function filteredKeys(obj, filter) {
	filter ??= e => e[1];
	return Object.entries(obj).filter(filter).map(e => e[0]);
}

/* <><><><> <><><><> <><><><> <><><><> */

/**
 * Sort the provided object by its values or by an inner sortKey.
 * @param {object} obj - The object to sort.
 * @param {string} [sortKey] - An inner key upon which to sort.
 * @returns {object} - A copy of the original object that has been sorted.
 */
export function sortObjectEntries(obj, sortKey) {
	let sorted = Object.entries(obj);
	const sort = (a, b) => foundry.utils.getType(a) === "string" ? a.localeCompare(b) : a - b;
	if ( sortKey ) sorted = sorted.sort((a, b) => sort(a[1][sortKey], b[1][sortKey]));
	else sorted = sorted.sort((a, b) => sort(a[1], b[1]));
	return Object.fromEntries(sorted);
}
