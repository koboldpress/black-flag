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
